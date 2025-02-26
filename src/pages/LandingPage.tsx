import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { 
  AudioWaveform as Waveform,
  Radio,
  Users,
  Shield,
  Zap,
  Music2,
  ArrowRight,
  Globe2,
  Headphones,
  Star,
  Check,
  Clock,
  QrCode,
  Infinity
} from 'lucide-react';

interface PricingTierProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  onSelect: () => void;
}

function PricingTier({ name, price, description, features, cta, popular, onSelect }: PricingTierProps) {
  return (
    <div className={`relative bg-white/5 rounded-xl p-6 backdrop-blur-sm border ${
      popular ? 'border-indigo-500' : 'border-white/10'
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="text-3xl font-bold mb-2">{price}</div>
        <p className="text-white/60">{description}</p>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <span className="text-white/80">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          popular
            ? 'bg-indigo-500 text-white hover:bg-indigo-600'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const handleStartStreaming = () => {
    if (user) {
      navigate('/dashboard/broadcast');
    } else {
      navigate('/login');
    }
  };

  const handleUpgradeClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!subscription || subscription.tier === 'free') {
      navigate('/dashboard/settings');
    } else {
      window.location.href = 'mailto:support@mixlnk.com?subject=Enterprise%20Inquiry';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Your Stream, Your Sound,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                Your Rules
              </span>
            </h1>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Stream high-quality audio live to your audience—effortlessly. Free for casual users, affordable for pros.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleStartStreaming}
                className="bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
              >
                {user ? 'Go to Dashboard' : 'Start Streaming for Free'} <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleUpgradeClick}
                className="bg-white/5 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                {(!subscription || subscription.tier === 'free') ? 'Upgrade for More Time' : 'Contact for Enterprise'}
              </button>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Mixlnk?</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Professional-grade audio streaming made simple. Focus on your content while we handle the technical details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <Radio className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Crystal Clear Audio</h3>
              <p className="text-white/60">
                Stream in high-quality stereo with support for professional audio interfaces.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Global Reach</h3>
              <p className="text-white/60">
                Reach listeners worldwide with our reliable CDN infrastructure.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
              <p className="text-white/60">
                Control who can listen with our advanced access management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include our core features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingTier
              name="Free"
              price="$0"
              description="Perfect for casual streamers"
              features={[
                "30 minutes weekly streaming",
                "2 concurrent listeners",
                "Standard audio quality",
                "Basic analytics"
              ]}
              cta="Start Streaming"
              onSelect={handleStartStreaming}
            />

            <PricingTier
              name="Pro"
              price="$19/mo"
              description="For serious broadcasters"
              features={[
                "4 hours weekly streaming",
                "Unlimited listeners",
                "High-quality audio",
                "Advanced analytics",
                "Priority support"
              ]}
              popular
              cta="Upgrade Now"
              onSelect={handleUpgradeClick}
            />

            <PricingTier
              name="Enterprise"
              price="Custom"
              description="For professional studios"
              features={[
                "Unlimited streaming",
                "Unlimited listeners",
                "Ultra-high quality audio",
                "Custom integrations",
                "24/7 support"
              ]}
              cta="Contact Sales"
              onSelect={handleUpgradeClick}
            />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="py-24 bg-gradient-to-b from-black/20 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-white/60">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">What equipment do I need?</h3>
              <p className="text-white/60">
                Any computer with a microphone will work! For best quality, we recommend using an audio interface and professional microphone.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Can I record my streams?</h3>
              <p className="text-white/60">
                Yes! All Pro and Enterprise plans include automatic recording and cloud storage of your streams.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">What's the audio quality like?</h3>
              <p className="text-white/60">
                We support up to 320kbps stereo audio. Free plans stream at 128kbps, Pro at 256kbps, and Enterprise at 320kbps.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Can I customize the player?</h3>
              <p className="text-white/60">
                Pro and Enterprise plans include player customization options, including branding and color schemes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}