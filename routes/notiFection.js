// routes/notificationRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import { Notification } from "../Module.js"; // Make sure Module.js also uses ESM
import jwt from "jsonwebtoken";

const router = express.Router();


// --- POST Endpoint: Create a new notification (Already Present) ---
// URL: /api/notifications
router.post('/update-noti', async (req, res) => {
  try {
    const { name, index } = req.body; // Destructure the required fields

    if (!index) {
        return res.status(400).json({ 
            message: 'Index is required for update or creation.', 
        });
    }

    // Use findOneAndUpdate with upsert: true
    const updatedOrNewNotification = await Notification.findOneAndUpdate(
      
      // 1. QUERY: Find a document where the 'index' matches the incoming index
      { index: index }, 
      
      // 2. UPDATE: Set the new values (overwriting old name and index)
      { $set: { name: name, index: index } }, 
      
      // 3. OPTIONS:
      { 
        new: true,          // Return the document AFTER update
        upsert: true,       // CRITICAL: Create the document if it doesn't exist
        runValidators: true // Run Mongoose validators on the update
      }
    );

    // If upsert creates a new document, the status should be 201 (Created).
    // If upsert updates an existing document, the status should ideally be 200 (OK).
    // We'll use 200/201 based on Mongoose's response, or just 200 for simplicity.
    res.status(200).json(updatedOrNewNotification); 

  } catch (error) {
    // Handle validation errors or server errors
    res.status(400).json({ 
      message: 'Failed to update or create notification', 
      error: error.message 
    });
  }
});

// --- GET Endpoint: Retrieve all notifications (Already Present) ---
// URL: /api/notifications
router.get('/update-noti', async (req, res) => {
  try {
    // Find all documents in the Notification collection
    const notifications = await Notification.find(); 
    
    res.status(200).json(notifications); 

  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve notifications', 
      error: error.message 
    });
  }
});

// -----------------------------------------------------------------
// 🚀 NEW: PUT Endpoint: Update a notification by ID
// URL: /api/notifications/:id
router.put('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the notification by ID and update it. 'new: true' returns the updated document.
    const updatedNotification = await Notification.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true } // runValidators ensures Mongoose validates the update
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Respond with the updated resource and 200 OK status
    res.status(200).json(updatedNotification);

  } catch (error) {
    // Handle validation errors (400) or server errors (500)
    res.status(400).json({ 
      message: 'Failed to update notification', 
      error: error.message 
    });
  }
});
// -----------------------------------------------------------------

// -----------------------------------------------------------------
// 🗑️ NEW: DELETE Endpoint: Delete a notification by ID
// URL: /api/notifications/:id
router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the notification by ID and remove it
    const deletedNotification = await Notification.findByIdAndDelete(id);

    if (!deletedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Respond with 204 No Content for a successful deletion
    // Optionally, you can send back the deleted item or a simple success message
    res.status(204).send(); 
    // Or: res.status(200).json({ message: 'Notification deleted successfully' });

  } catch (error) {
    // Handle server errors (500)
    res.status(500).json({ 
      message: 'Failed to delete notification', 
      error: error.message 
    });
  }
});
// -----------------------------------------------------------------

export default router;