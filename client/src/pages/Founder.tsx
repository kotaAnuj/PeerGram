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
          <CardDescription>The mind behind PeerGram</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3 flex justify-center">
              <img 
                src="/founder.jpg" 
                alt="Kota Anuj Kumar" 
                className="rounded-lg shadow-md max-w-[250px] w-full h-auto"
              />
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <h2 className="text-xl font-bold">Kota Anuj Kumar</h2>
              <p className="text-sm text-muted-foreground">Tech Enthusiast & AI Engineer</p>
              <p className="text-sm font-medium">Built PeerGram in just 3 days - March 16, 2025</p>
              
              <p className="mt-4">
                I'm passionate about building decentralized systems that give power back to users. 
                PeerGram is a true peer-to-peer social network that doesn't rely on central servers 
                to store your data - everything is distributed across the network.
              </p>
              
              <p>
                As an AI engineer and tech enthusiast, I believe the future of social media should be:
              </p>
              
              <ul className="list-disc pl-5 space-y-1">
                <li>Private - your data belongs to you</li>
                <li>Decentralized - not controlled by a single entity</li>
                <li>Resilient - works even when parts of the network are down</li>
                <li>Innovative - embraces new technologies like WebRTC</li>
              </ul>
              
              <p className="text-sm mt-4">
                Connect with me to share your thoughts on how we can make PeerGram even better!
              </p>
              
              <div className="flex gap-4 mt-4">
                <Button size="sm" variant="outline">
                  <i className="fab fa-github mr-2"></i>
                  GitHub
                </Button>
                <Button size="sm" variant="outline">
                  <i className="fab fa-linkedin mr-2"></i>
                  LinkedIn
                </Button>
                <Button size="sm" variant="outline">
                  <i className="fab fa-twitter mr-2"></i>
                  Twitter
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How to Use PeerGram</CardTitle>
          <CardDescription>
            Quick guide to help you get started with PeerGram's social features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <h3 className="font-bold mb-2">Managing Connection Requests</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click on the <strong>Network</strong> icon in the navigation menu</li>
              <li>Select the <strong>Connection Requests</strong> tab to see pending requests</li>
              <li>To accept a request, click the <strong>Accept</strong> button</li>
              <li>To decline a request, click the <strong>Decline</strong> button</li>
              <li>You can also click on a user's profile to learn more about them before deciding</li>
            </ol>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-bold mb-2">Viewing Content</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>The <strong>Home</strong> feed shows posts from you and your connections</li>
              <li>The <strong>Explore</strong> page has three tabs:
                <ul className="list-disc pl-5 mt-1">
                  <li><strong>All Posts</strong> - content from everyone on the network</li>
                  <li><strong>Friends</strong> - posts only from users you've connected with</li>
                  <li><strong>P2P Network</strong> - posts from users who are currently online in your peer-to-peer network</li>
                </ul>
              </li>
              <li>Click on any post to view details, comments, and interact with it</li>
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