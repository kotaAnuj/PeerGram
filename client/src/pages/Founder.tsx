import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';

export default function Founder() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Meet the Founder</CardTitle>
          <CardDescription>The mind behind our P2P Social Network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3 flex justify-center">
              <img 
                src="/founder-new.jpg" 
                alt="Kota Anuj Kumar" 
                className="rounded-lg shadow-md max-w-[250px] w-full h-auto"
              />
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <h2 className="text-xl font-bold">Kota Anuj Kumar</h2>
              <p className="text-sm text-muted-foreground">Tech Enthusiast & AI Engineer</p>
              <p className="text-sm font-medium">Built this P2P Social Network in just 3 days - March 2025</p>
              
              <p className="mt-4">
                I'm passionate about building decentralized systems that give power back to users. 
                This platform is a true peer-to-peer social network that doesn't rely on central 
                servers to store your data - everything is distributed across the network using 
                cutting-edge WebRTC technology.
              </p>
              
              <p>
                As a software engineer and tech enthusiast, I believe the future of social media should be:
              </p>
              
              <ul className="list-disc pl-5 space-y-1">
                <li>Private - your data belongs to you</li>
                <li>Decentralized - not controlled by a single entity</li>
                <li>Resilient - works even when parts of the network are down</li>
                <li>Innovative - embraces new technologies like WebRTC</li>
              </ul>
              
              <p className="text-sm mt-4">
                Connect with me to share your thoughts on how we can make this platform even better!
              </p>
              
              <div className="flex gap-4 mt-4">
                <Button size="sm" variant="outline" onClick={() => window.open("https://github.com/kotaAnuj", "_blank")}>
                  <i className="fab fa-github mr-2"></i>
                  GitHub
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open("https://www.linkedin.com/in/anuj-kumar-083a052a2", "_blank")}>
                  <i className="fab fa-linkedin mr-2"></i>
                  LinkedIn
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Platform</CardTitle>
          <CardDescription>
            Quick guide to help you get started with our platform's social features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-bold mb-2">Creating Your Profile</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click on your profile icon in the top right</li>
              <li>Fill in your bio, add a profile picture, and complete your details</li>
              <li>Your profile is your central place to share information about yourself</li>
              <li>All your posts will appear on your profile page for others to see</li>
            </ol>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-bold mb-2">Finding & Connecting with Friends</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click on the <strong>Search</strong> icon in the navigation menu</li>
              <li>Type a username or name in the search box</li>
              <li>Browse the results and click on a profile to view more details</li>
              <li>On their profile page, click the <strong>Connect</strong> button to send a connection request</li>
              <li>Wait for them to accept your request to become connected</li>
            </ol>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-bold mb-2">Creating and Interacting with Posts</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click the <strong>Create Post</strong> button from the home screen</li>
              <li>Add your image, write a description, and share with your network</li>
              <li>Like posts by clicking the heart icon</li>
              <li>Comment on posts to start a conversation</li>
              <li>Browse posts from your connections on the home feed</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="default" onClick={() => setLocation('/')}>
            Start Exploring
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}