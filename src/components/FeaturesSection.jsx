import React from 'react';
import { MessageSquare, ShoppingCart, CheckSquare, Users, BarChart2, BookOpen, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeaturesSection = () => {
  const navigate = useNavigate();
  
  const handleNavigateToChat = () => {
    navigate('/chat');
  };
  
  const handleNavigateToHub = () => {
    navigate('/hub');
    console.log('Navigating to hub'); // Add debugging to verify click handler is triggered
  };

  return (
    <div className="grid grid-cols-3 gap-6 bg-gray-900 text-white p-8">
      {/* Features Column */}
      <div>
        <h2 className="text-lg font-semibold mb-6">Explore Our Features</h2>
        
        <div className="space-y-6">
          <FeatureItem 
            icon={<MessageSquare className="h-5 w-5 group-hover:text-green-500" />}
            title="Messaging System"
            description="Connect with farmers and suppliers easily."
            onClick={handleNavigateToChat}
          />
          
          <FeatureItem 
            icon={<ShoppingCart className="h-5 w-5 group-hover:text-green-500" />}
            title="Marketplace"
            description="Buy and sell farm essentials effortlessly."
          />
          
          <FeatureItem 
            icon={<CheckSquare className="h-5 w-5 group-hover:text-green-500" />}
            title="Task Management"
            description="Stay organized and on track with tasks."
          />
          
          <FeatureItem 
            icon={<Users className="h-5 w-5 group-hover:text-green-500" />}
            title="Community Hub"
            description="Join discussions and share best practices."
            onClick={handleNavigateToHub}
          />
        </div>
      </div>
      
      {/* Community Posts Column */}
      <div>
        <h2 className="text-lg font-semibold mb-6">Latest community Posts</h2>
        
        <div className="space-y-6">
          <FeatureItem 
            icon={<File className="h-5 w-5 group-hover:text-green-500" />}
            title="Farming Tips"
            description="Discover expert advice for better yields."
          />
          
          <FeatureItem 
            icon={<BarChart2 className="h-5 w-5 group-hover:text-green-500" />}
            title="Market Trends"
            description="Stay updated with the latest market insights."
          />
          
          <FeatureItem 
            icon={<BookOpen className="h-5 w-5 group-hover:text-green-500" />}
            title="Success Stories"
            description="Read how others have thrived with us."
          />
          
          <FeatureItem 
            icon={<File className="h-5 w-5 group-hover:text-green-500" />}
            title="Resource Center"
            description="Access valuable tools and resources for farming."
          />
        </div>
      </div>
      
      {/* Featured Articles Column */}
      <div>
        <h2 className="text-lg font-semibold mb-6">Featured Articles</h2>
        
        <div className="space-y-6">
          <ArticleCard 
            image="/images/Placeholder Image.png"
            title="Sustainable Farming"
            description="Learn how to farm sustainably and profitably."
          />
          
          <ArticleCard 
            image="/images/Placeholder Image-1.png"
            title="Crop Management"
            description="Optimize your crop yields with these strategies."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, description, onClick }) => {
  return (
    <div 
      className="flex group cursor-pointer transition-all duration-200 p-2 rounded-lg hover:bg-gray-800"
      onClick={onClick}
    >
      <div className="mr-3 mt-1 transition-colors duration-200 text-gray-400 group-hover:text-green-500">
        {icon}
      </div>
      <div>
        <h3 className="font-medium group-hover:text-green-500 transition-colors duration-200">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
};

const ArticleCard = ({ image, title, description }) => {
  return (
    <div className="flex bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
      <img src={image} alt={title} className="w-32 h-24 object-cover" />
      <div className="p-3">
        <h3 className="font-medium hover:text-green-500 transition-colors duration-200">{title}</h3>
        <p className="text-sm text-gray-400 mb-2">{description}</p>
        <a href="#" className="text-sm text-green-500 hover:underline">Read more</a>
      </div>
    </div>
  );
};

export default FeaturesSection;