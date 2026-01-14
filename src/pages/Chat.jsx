import React, { useState, useEffect, useRef } from "react";
import { Match, Profile, Message } from "@/entities/all";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CharterResults from "../components/charter/CharterResults";

export default function ChatPage() {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const matchId = urlParams.get("matchId");

      if (!matchId) {
        navigate(createPageUrl("Matches"));
        return;
      }

      const userData = await User.me();
      setUser(userData);

      const matches = await Match.filter({ id: matchId });
      if (matches.length === 0) {
        navigate(createPageUrl("Matches"));
        return;
      }

      const matchData = matches[0];
      setMatch(matchData);

      const otherUserId = matchData.user1_id === userData.id ? matchData.user2_id : matchData.user1_id;
      const profiles = await Profile.filter({ user_id: otherUserId });
      if (profiles.length > 0) {
        setOtherProfile(profiles[0]);
      }

      // בדיקה אם שני המשתמשים מילאו את החרטר
      const { base44 } = require('@/api/base44Client');
      const allQuestions = 8; // סה"כ שאלות בחרטר
      
      const myAnswers = await base44.entities.CharterAnswer.filter({ 
        match_id: matchId,
        user_id: userData.id 
      });
      
      const theirAnswers = await base44.entities.CharterAnswer.filter({ 
        match_id: matchId,
        user_id: otherUserId 
      });

      // אם אני לא מילאתי - מפנה לחרטר
      if (myAnswers.length < allQuestions) {
        window.dispatchEvent(new Event('openCharter'));
        navigate(createPageUrl("Matches"));
        return;
      }

      const matchMessages = await Message.filter({ match_id: matchId }, "created_date");
      setMessages(matchMessages);
    } catch (error) {
      console.error("Error loading chat:", error);
      navigate(createPageUrl("Matches"));
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent || !match || !user) return;

    try {
      const messageData = {
        match_id: match.id,
        sender_id: user.id,
        content: messageContent,
        is_read: false
      };

      const createdMessage = await Message.create(messageData);
      setMessages(prev => [...prev, createdMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (!otherProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p>לא נמצא פרופיל</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate(createPageUrl("Matches"))} className="p-2">
          <ArrowRight className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <img
            src={otherProfile.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"}
            alt={otherProfile.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h2 className="font-bold text-gray-900">{otherProfile.name}</h2>
            <p className="text-sm text-gray-500">{otherProfile.location}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <CharterResults matchId={match.id} />
        
        {messages.length === 0 ? null : (
          messages.map((msg, idx) => {
            const isMyMessage = msg.sender_id === user.id;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMyMessage
                      ? "gradient-orange text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="הקלד/י הודעה..."
            className="flex-1 bg-gray-100 border-0"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="gradient-orange text-white rounded-full w-12 h-12 p-0 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}