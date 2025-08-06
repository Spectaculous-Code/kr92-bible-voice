// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-8">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome to Your App
        </h1>
        <p className="text-xl text-foreground/80 leading-relaxed">
          Your development environment is ready! Start building something amazing.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <div className="px-6 py-3 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-primary font-medium">React + TypeScript</span>
          </div>
          <div className="px-6 py-3 bg-secondary/10 rounded-lg border border-border">
            <span className="text-foreground font-medium">Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
