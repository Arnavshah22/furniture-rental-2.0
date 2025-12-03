import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/model/user.model';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Sign-up API called ===');

    const body = await req.json();
    console.log('Request body received:', { username: body.username, email: body.email, hasPassword: !!body.password });

    const { username, email, password } = body;

    // Validate input
    if (!username || !email || !password) {
      console.log('Validation failed - missing fields:', { username: !!username, email: !!email, password: !!password });
      return NextResponse.json(
        { message: 'All fields are required', details: { username: !!username, email: !!email, password: !!password } },
        { status: 400 }
      );
    }

    console.log('Connecting to database...');
    // Connect to the database
    await dbConnect();
    console.log('Database connected successfully');

    // Check if the user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }
    console.log('No existing user found, proceeding with registration');

    // Save the new user to the database
    const newUser = new User({
      username,
      email,
      password, // Storing plain password directly
    });

    console.log('Saving new user to database...');
    // Save the new user
    await newUser.save();
    console.log('User saved successfully:', newUser._id);

    // Nodemailer setup for sending confirmation emails
    console.log('Setting up email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Account Confirmation',
      text: `Hello ${username},\n\nThank you for registering and your password: ${password}. Please confirm your email by clicking the following link: \nhttp://Ario.com/confirm?email=${email}\n\nBest Regards,\nTeam`,
    };

    console.log('Sending confirmation email to:', email);
    // Send confirmation email
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully');

    // Respond with success
    return NextResponse.json(
      { message: 'User registered successfully, confirmation email sent', user: newUser },
      { status: 201 }
    );

  } catch (error: unknown) { // Explicitly typing the error as unknown
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    console.error('=== ERROR during registration process ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', errorMessage);
    console.error('Full error:', error);
    return NextResponse.json(
      { message: 'Error registering user', error: errorMessage },
      { status: 500 }
    );
  }
}
