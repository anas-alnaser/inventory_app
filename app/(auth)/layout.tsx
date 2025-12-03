
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-cyan-600 to-cyan-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img 
            src="/icon.svg" 
            alt="StockWave" 
            className="h-12 w-12 rounded-xl object-contain bg-white/20 backdrop-blur p-2"
          />
          <span className="text-2xl font-bold text-white">StockWave</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Smart Inventory
            <br />
            for Modern
            <br />
            Restaurants
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            AI-powered inventory management that predicts your needs, 
            reduces waste, and keeps your kitchen running smoothly.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-6">
            <div>
              <p className="text-3xl font-bold text-white">30%</p>
              <p className="text-blue-200 text-sm">Less Food Waste</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">2hrs</p>
              <p className="text-blue-200 text-sm">Saved Daily</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99%</p>
              <p className="text-blue-200 text-sm">Stock Accuracy</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            Trusted by 500+ restaurants across Jordan
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
