import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Submit Feedback (Used by Chatbot & Contact form)
app.post('/api/v1/feedback', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, query } = req.body;
    
    if (!email || !query) {
      return res.status(400).json({ error: 'Email and query are required' });
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        email,
        query,
        status: 'Pending'
      }
    });

    return res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// 2. Get Feedbacks for Admin Portal
app.get('/api/v1/feedback', async (req: Request, res: Response): Promise<any> => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

// 3. Update Feedback Status (For Admin Portal toggling)
app.put('/api/v1/feedback/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedFeedback = await prisma.feedback.update({
      where: { id: id as string },
      data: { status }
    });

    return res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// 4. Delete Feedback (For Admin Portal deletion)
app.delete('/api/v1/feedback/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.feedback.delete({
      where: { id: id as string }
    });

    return res.status(200).json({ message: 'Feedback deleted' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// 5. Admin Login
app.post('/api/v1/admin/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    
    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// 6. Admin Setup (Seed)
app.post('/api/v1/admin/seed', async (req: Request, res: Response): Promise<any> => {
  try {
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const admin = await prisma.admin.create({
      data: {
        email: 'admin@sangam.com',
        password: 'sangam@admin2026'
      }
    });

    return res.status(201).json({ message: 'Default admin created', admin });
  } catch (error) {
    console.error('Error seeding admin:', error);
    return res.status(500).json({ error: 'Failed to seed admin' });
  }
});

// --- Positions (Careers) ---

// 7. Get All Positions
app.get('/api/v1/positions', async (req: Request, res: Response): Promise<any> => {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// 8. Create Position (Admin)
app.post('/api/v1/positions', async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, department, location, description } = req.body;
    if (!title || !department || !location || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newPosition = await prisma.position.create({
      data: { title, department, location, description }
    });
    return res.status(201).json({ message: 'Position created successfully', position: newPosition });
  } catch (error) {
    console.error('Error creating position:', error);
    return res.status(500).json({ error: 'Failed to create position' });
  }
});

// 9. Delete Position (Admin)
app.delete('/api/v1/positions/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.position.delete({
      where: { id: id as string }
    });
    return res.status(200).json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Error deleting position:', error);
    return res.status(500).json({ error: 'Failed to delete position' });
  }
});

// --- Job Applications ---

// 10. Get All Applications
app.get('/api/v1/applications', async (req: Request, res: Response): Promise<any> => {
  try {
    const apps = await prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(apps);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// 11. Create Application (Frontend)
app.post('/api/v1/applications', async (req: Request, res: Response): Promise<any> => {
  try {
    const { positionId, name, email, phone, resumeLink, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const newApp = await prisma.jobApplication.create({
      data: { positionId, name, email, phone, resumeLink, message }
    });
    return res.status(201).json({ message: 'Application submitted successfully', application: newApp });
  } catch (error) {
    console.error('Error creating application:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

// 12. Update Application Status (Admin)
app.put('/api/v1/applications/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedApp = await prisma.jobApplication.update({
      where: { id: id as string },
      data: { status }
    });

    return res.status(200).json(updatedApp);
  } catch (error) {
    console.error('Error updating application:', error);
    return res.status(500).json({ error: 'Failed to update application' });
  }
});

// 13. Delete Application (Admin)
app.delete('/api/v1/applications/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.jobApplication.delete({
      where: { id: id as string }
    });
    return res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Start Server
console.log(`Server is running on http://localhost:${PORT}`);
app.listen(PORT);

