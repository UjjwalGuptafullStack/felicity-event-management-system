import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, ArrowRight, ChevronRight, Users, Heart } from 'lucide-react';
import { completeOnboarding, listOrganizers, followOrganizer } from '../../api/participant';

const INTEREST_OPTIONS = [
  { value: 'tech',           label: 'Technology & Coding',   emoji: '💻' },
  { value: 'sports',         label: 'Sports & Fitness',       emoji: '⚽' },
  { value: 'cultural',       label: 'Cultural & Arts',        emoji: '🎭' },
  { value: 'music',          label: 'Music',                  emoji: '🎵' },
  { value: 'dance',          label: 'Dance',                  emoji: '💃' },
  { value: 'literature',     label: 'Literature & Quiz',      emoji: '📚' },
  { value: 'gaming',         label: 'Gaming',                 emoji: '🎮' },
  { value: 'science',        label: 'Science & Research',     emoji: '🔬' },
  { value: 'entrepreneurship', label: 'Entrepreneurship',     emoji: '🚀' },
  { value: 'design',         label: 'Design & Creativity',    emoji: '🎨' },
  { value: 'photography',    label: 'Photography & Film',     emoji: '📷' },
  { value: 'social',         label: 'Social & Community',     emoji: '🤝' },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    listOrganizers()
      .then(res => setOrganizers(res.data.organizers || []))
      .catch(() => setOrganizers([]))
      .finally(() => setOrgLoading(false));
  }, []);

  const toggleInterest = (value) => {
    setSelectedInterests(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    );
  };

  const toggleFollow = (id) => {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFinish = async (skip = false) => {
    setLoading(true);
    try {
      await completeOnboarding({ interests: skip ? [] : selectedInterests });
      if (!skip && followedIds.size > 0) {
        await Promise.allSettled([...followedIds].map(id => followOrganizer(id)));
      }
      try {
        const stored = JSON.parse(localStorage.getItem('actor') || '{}');
        if (stored.user) stored.user.onboardingCompleted = true;
        localStorage.setItem('actor', JSON.stringify(stored));
      } catch (_) {}
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      navigate('/participant/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at top, #0f1c16 0%, #0b0f0d 60%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header card */}
        <div className="rounded-t-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1b7f5f 0%, #27a57a 60%, #3ddc97 100%)' }}>
          <div className="px-8 py-7">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-white/90" />
              <span className="text-white/80 text-sm font-medium tracking-wide">Welcome to Felicity!</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1.5 leading-tight">
              {step === 1 ? 'What are you into?' : 'Clubs to follow?'}
            </h1>
            <p className="text-white/75 text-sm">
              {step === 1
                ? 'Select your interests to personalise your event recommendations'
                : 'Follow clubs and organizers to get updates on their events'}
            </p>
            {/* Step dots */}
            <div className="flex gap-2 mt-5">
              {[1, 2].map(s => (
                <div key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-white flex-[2]' : 'bg-white/30 flex-1'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-card border border-t-0 border-border rounded-b-2xl shadow-2xl">
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">

              {/* Step 1 — Interests */}
              {step === 1 && (
                <motion.div
                  key="interests"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8">
                    {INTEREST_OPTIONS.map(opt => {
                      const selected = selectedInterests.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleInterest(opt.value)}
                          style={{ background: 'none' }}
                          className={`relative flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer
                            ${selected
                              ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_rgba(61,220,151,0.2)]'
                              : 'border-border bg-muted/30 hover:border-accent/40 hover:bg-muted/60'
                            }`}
                        >
                          <span className="text-lg leading-none">{opt.emoji}</span>
                          <span className={`text-sm font-semibold leading-tight flex-1 ${selected ? 'text-accent' : 'text-foreground'}`}>
                            {opt.label}
                          </span>
                          {selected && (
                            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedInterests.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-5">
                      {selectedInterests.length} selected
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleFinish(true)}
                      style={{ background: 'none' }}
                      className="text-sm text-muted-foreground hover:text-foreground-secondary transition-colors px-3 py-2 rounded-lg hover:bg-muted/30 cursor-pointer"
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      style={{ background: 'linear-gradient(135deg, #1b7f5f 0%, #27a57a 100%)' }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Organizers */}
              {step === 2 && (
                <motion.div
                  key="organizers"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {orgLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-9 h-9 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : organizers.length === 0 ? (
                    <div className="text-center py-16">
                      <Users className="w-12 h-12 text-border mx-auto mb-3" />
                      <p className="text-muted-foreground">No clubs available yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mb-6 custom-scrollbar">
                      {organizers.map(org => {
                        const following = followedIds.has(org._id);
                        return (
                          <div
                            key={org._id}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150
                              ${following ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/20 hover:border-border/60'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">{org.name}</p>
                              {org.category && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{org.category}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleFollow(org._id)}
                              style={{ background: 'none' }}
                              className={`ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer
                                ${following
                                  ? 'bg-accent/15 text-accent border-accent/30'
                                  : 'bg-muted/30 text-muted-foreground border-border hover:border-accent/40 hover:text-accent'
                                }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${following ? 'fill-current' : ''}`} />
                              {following ? 'Following' : 'Follow'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ background: 'none' }}
                      className="text-sm text-muted-foreground hover:text-foreground-secondary transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted/30 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleFinish(true)}
                        style={{ background: 'none' }}
                        className="text-sm text-muted-foreground hover:text-foreground-secondary transition-colors px-4 py-2 rounded-lg hover:bg-muted/30 cursor-pointer"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFinish(false)}
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg, #3ddc97 0%, #27a57a 100%)' }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[#0b120f] font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                      >
                        {loading ? 'Saving…' : "Let's go!"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Onboarding;
