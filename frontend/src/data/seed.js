export function seedState() {
  return {
    me: {
      name: "Admin Student",
      bio: "Designing social experiences with modern frontend architecture.",
      avatar: "https://i.pravatar.cc/200?img=13",
      cover:
        "linear-gradient(130deg, rgba(14,107,137,1) 0%, rgba(20,188,177,1) 35%, rgba(255,119,85,1) 100%)"
    },
    friends: [
      { id: "f1", name: "Ayesha", avatar: "https://i.pravatar.cc/150?img=47" },
      { id: "f2", name: "Rita", avatar: "https://i.pravatar.cc/150?img=49" },
      { id: "f3", name: "Nora", avatar: "https://i.pravatar.cc/150?img=32" },
      { id: "f4", name: "Sam", avatar: "https://i.pravatar.cc/150?img=18" }
    ],
    friendRequests: ["Ahmed", "Nisha", "Carl"],
    posts: [
      {
        id: "p1",
        user: "Ayesha",
        content: "Sunrise trail complete. Productivity level: unlocked.",
        mediaType: "image",
        mediaUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200",
        likes: 24,
        comments: 4,
        shares: 2,
        createdAt: "Today 8:12 AM"
      },
      {
        id: "p2",
        user: "Dev Group",
        content: "Group chat alert: API integration workshop at 8 PM.",
        mediaType: "video",
        mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        likes: 36,
        comments: 9,
        shares: 7,
        createdAt: "Today 10:40 AM"
      }
    ],
    trending: ["#CampusLife", "#FrontendDev", "#AIProjects", "#HackathonWeek", "#FitnessGoals"],
    conversations: {
      Ayesha: [
        { id: "m1", from: "Ayesha", text: "Joining the design review call?" },
        { id: "m2", from: "me", text: "Yes, in 10 minutes." }
      ],
      "Dev Group": [
        { id: "m3", from: "Nora", text: "Share your UI preview in this thread." },
        { id: "m4", from: "me", text: "Uploading now." }
      ]
    },
    notifications: [
      { id: "n1", type: "like", text: "Sam liked your post", at: "2m ago" },
      { id: "n2", type: "comment", text: "Rita commented on your update", at: "8m ago" },
      { id: "n3", type: "request", text: "Ahmed sent a friend request", at: "24m ago" },
      { id: "n4", type: "message", text: "New message from Ayesha", at: "39m ago" }
    ],
    slides: [
      {
        title: "Creator Sprint",
        text: "Ship one creative post this week and get featured in community picks."
      },
      {
        title: "Campus Cleanup Drive",
        text: "Volunteers meet Saturday morning. Live updates will be highlighted."
      },
      {
        title: "Hackathon Broadcast",
        text: "Build logs and progress snapshots from top teams streaming now."
      }
    ]
  };
}
