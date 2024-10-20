require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();


app.use(cors());
app.use(bodyParser.json());

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

const Client = mongoose.model('Client', new mongoose.Schema({
  name: String,
  phone_no: String,
  company_name: String,
  company_email: String,
  employee_size: Number,
  verified: Boolean,
  emailOTP: String,
  mobileOTP: String,
  loginOTP: String 
}, { strict: false }), 'clients');


const EmailLog = mongoose.model('EmailLog', new mongoose.Schema({
  recipient: String,
  subject: String,
  body: String,
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  },
  error: String,
  sentAt: {
    type: Date,
    default: Date.now
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  type: {
    type: String,
    enum: ['verification', 'login', 'job_invitation'],
    required: true
  }
}), 'email_logs');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});


async function sendEmailWithLogging({
  to,
  subject,
  text,
  clientId,
  type
}) {
  const emailLog = new EmailLog({
    recipient: to,
    subject,
    body: text,
    clientId,
    type
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });

    emailLog.status = 'sent';
    await emailLog.save();
    return true;
  } catch (error) {
    emailLog.status = 'failed';
    emailLog.error = error.message;
    await emailLog.save();
    throw error;
  }
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};


const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


app.post('/register', async (req, res) => {
  try {
    const { name, phone_no, company_name, company_email, employee_size } = req.body;

    const existingClient = await Client.findOne({
      $or: [
        { company_email: company_email },
        { phone_no: phone_no }
      ]
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email or phone number already exists.'
      });
    }

    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    const newClient = new Client({
      name,
      phone_no,
      company_name,
      company_email,
      employee_size: parseInt(employee_size, 10),
      verified: false,
      emailOTP,
      mobileOTP
    });

    await newClient.save();

    await sendEmailWithLogging({
      to: company_email,
      subject: 'Email Verification OTP',
      text: `Your email verification OTP is: ${emailOTP}`,
      clientId: newClient._id,
      type: 'verification'
    });

    await twilioClient.messages.create({
      body: `Your mobile verification OTP is: ${mobileOTP}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone_no
    });

    res.status(200).json({
      success: true,
      message: 'Client registered successfully. OTPs sent.',
      clientId: newClient._id
    });
  } catch (error) {
    console.error('Error registering client:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering client: ' + error.message
    });
  }
});


app.post('/login', async (req, res) => {
  try {
    const { phone_no, company_email } = req.body;

    const client = await Client.findOne({
      $or: [
        { company_email: company_email },
        { phone_no: phone_no }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    const loginOTP = generateOTP();
    client.loginOTP = loginOTP;
    await client.save();

    if (company_email) {
      await sendEmailWithLogging({
        to: company_email,
        subject: 'Login OTP',
        text: `Your login OTP is: ${loginOTP}`,
        clientId: client._id,
        type: 'login'
      });
    } else {
      await twilioClient.messages.create({
        body: `Your login OTP is: ${loginOTP}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone_no
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent for login.',
      clientId: client._id
    });
  } catch (error) {
    console.error('Error sending OTP for login:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP for login: ' + error.message
    });
  }
});


app.post('/verify-login-otp', async (req, res) => {
  try {
    const { clientId, loginOTP } = req.body;
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    if (client.loginOTP !== loginOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.'
      });
    }

    const token = jwt.sign(
      { 
        id: client._id,
        email: client.company_email,
        name: client.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    client.loginOTP = undefined;
    await client.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      token,
      user: {
        id: client._id,
        name: client.name,
        email: client.company_email
      }
    });
  } catch (error) {
    console.error('Error verifying login OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying login OTP: ' + error.message
    });
  }
});

app.post('/job-postings', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, jobDescription, experienceLevel, candidates, endDate } = req.body;
    
    const newPosting = {
      clientId: req.user.id,
      jobTitle,
      jobDescription,
      experienceLevel,
      candidates: candidates.map(email => ({
        email,
        status: 'pending',
        addedAt: new Date()
      })),
      endDate,
      status: 'active',
      createdAt: new Date()
    };

    const db = mongoose.connection.db;
    const postingsCollection = db.collection('postings');
    
    const result = await postingsCollection.insertOne(newPosting);

   
    for (const candidate of candidates) {
      try {
        await sendEmailWithLogging({
          to: candidate,
          subject: 'New Job Opportunity',
          text: `You have been invited to apply for the position of ${jobTitle}. Please check your dashboard for more details.`,
          clientId: req.user.id,
          type: 'job_invitation'
        });
      } catch (emailError) {
        console.error(`Error sending email to ${candidate}:`, emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      jobPosting: { ...newPosting, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job posting: ' + error.message
    });
  }
});

app.get('/job-postings', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const postingsCollection = db.collection('postings');

    console.log('Fetching all job postings');

    const jobPostings = await postingsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Found ${jobPostings.length} job postings`);

    res.status(200).json({
      success: true,
      jobPostings,
    });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job postings: ' + error.message,
    });
  }
});

app.get('/verification-status', authenticateToken, async (req, res) => {
  try {
    console.log('Checking verification status for user ID:', req.user.id);
    const client = await Client.findById(req.user.id);
    
    if (!client) {
      console.log('Client not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    console.log("CLIENT_NAME: ",client.name);
    console.log('Client verification status from database:', client.verified);
  
    res.status(200).json({
      success: true,
      verified: client.verified,
      message: client.verified ? 
        'Account fully verified' : 
        'Account not verified. Please complete email and phone verification.'
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification status: ' + error.message
    });
  }
});

app.post('/verify-otp', async (req, res) => {
  try {
    const { clientId, emailOTP, mobileOTP } = req.body;
    console.log('Verifying OTP for client ID:', clientId);

    const client = await Client.findById(clientId);
    console.log('Fetched client:', client);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    if (client.emailOTP !== emailOTP || client.mobileOTP !== mobileOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTPs.'
      });
    }

    client.verified = true;
    client.emailOTP = undefined;
    client.mobileOTP = undefined;
    await client.save();

    res.status(200).json({
      success: true,
      message: 'OTPs verified successfully.',
      redirectUrl: '/dashboard'
    });
  } catch (error) {
    console.error('Error verifying OTPs:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTPs: ' + error.message
    });
  }
});

app.post('/send-otp', authenticateToken, async (req, res) => {
  try {
    const client = await Client.findById(req.user.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    client.emailOTP = emailOTP;
    client.mobileOTP = mobileOTP;
    await client.save();

   
    await sendEmailWithLogging({
      to: client.company_email,
      subject: 'Email Verification OTP',
      text: `Your email verification OTP is: ${emailOTP}`,
      clientId: client._id,
      type: 'verification'
    });

    await twilioClient.messages.create({
      body: `Your mobile verification OTP is: ${mobileOTP}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: client.phone_no
    });

    res.status(200).json({
      success: true,
      message: 'OTPs sent successfully.',
      clientId: client._id
    });
  } catch (error) {
    console.error('Error sending OTPs:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTPs: ' + error.message
    });
  }
});


app.get('/email-logs', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query;
    
    const query = {};
    
    if (startDate && endDate) {
      query.sentAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    const logs = await EmailLog.find(query)
    .sort({ sentAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    logs
  });
} catch (error) {
  console.error('Error fetching email logs:', error);
  res.status(500).json({
    success: false,
    message: 'Error fetching email logs: ' + error.message
  });
}
});


const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});