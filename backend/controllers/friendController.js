// controllers/friendController.js
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      recipient: recipientId,
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Create new friend request
    const friendRequest = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    // Find and update the request
    const friendRequest = await FriendRequest.findByIdAndUpdate(
      requestId,
      { status: "accepted" },
      { new: true }
    );

    // Add friends to each other's friend list
    await User.findByIdAndUpdate(friendRequest.sender, {
      $push: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $push: { friends: friendRequest.sender },
    });

    res.json(friendRequest);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    // Find and delete the request
    await FriendRequest.findByIdAndDelete(requestId);

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get friend requests
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await FriendRequest.find({ recipient: userId, status: "pending" })
      .populate("sender", "username email");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get friends list
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("friends", "username email");
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};