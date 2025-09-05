import ProfessionalCricketApp from "@/components/ProfessionalCricketApp";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      {/* Stadium Background */}
      <div 
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2105&q=80')",
        }}
      >
        {/* Enhanced overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>
      
      <ProfessionalCricketApp />
    </div>
  );
};

export default Index;
