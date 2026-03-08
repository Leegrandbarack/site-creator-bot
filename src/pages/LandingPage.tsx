import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share2, ThumbsUp, Search, Users, PenSquare, MessageSquare, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="w-10 h-10 fill-primary shrink-0">
              <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 4.991 2.032 9.508 5.312 12.755V35l4.898-2.724A17.9 17.9 0 0 0 18 33.6c.725 0 1.439-.043 2.139-.126l.042-.005Z" />
              <path fill="white" d="M24.5 22.5L25.5 18h-4v-2.5c0-1.25.6-2.5 2.6-2.5h2v-4s-1.8-.3-3.6-.3c-3.7 0-6 2.2-6 6.3v3h-4v4.5h4v11c.8.1 1.6.2 2.5.2s1.7-.1 2.5-.2v-11h3z" />
            </svg>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9 h-9 w-56 rounded-full bg-muted border-0 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="font-semibold">
              Connexion
            </Button>
            <Button size="sm" onClick={() => document.getElementById("signup-section")?.scrollIntoView({ behavior: "smooth" })} className="font-semibold">
              Créer un compte
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="signup-section" className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left - Branding */}
          <div className="flex-1 text-center lg:text-left animate-fade-in">
            <svg viewBox="0 0 36 36" className="w-20 h-20 fill-primary mx-auto lg:mx-0 mb-6">
              <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 4.991 2.032 9.508 5.312 12.755V35l4.898-2.724A17.9 17.9 0 0 0 18 33.6c.725 0 1.439-.043 2.139-.126l.042-.005Z" />
              <path fill="white" d="M24.5 22.5L25.5 18h-4v-2.5c0-1.25.6-2.5 2.6-2.5h2v-4s-1.8-.3-3.6-.3c-3.7 0-6 2.2-6 6.3v3h-4v4.5h4v11c.8.1 1.6.2 2.5.2s1.7-.1 2.5-.2v-11h3z" />
            </svg>
            <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
              Connectez-vous avec vos amis et le monde qui vous entoure.
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
              Partagez vos moments, restez en contact avec vos proches et découvrez ce qui se passe autour de vous. Rejoignez notre communauté dès maintenant.
            </p>

            {/* Illustration - network circles */}
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Avatar key={i} className="w-10 h-10 border-2 border-card">
                    <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 10}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                +10k membres actifs
              </span>
            </div>
          </div>

          {/* Right - Signup Form */}
          <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="bg-card rounded-xl shadow-xl p-6 border border-border">
              <h2 className="text-2xl font-bold text-foreground text-center mb-2">Créer un compte</h2>
              <p className="text-sm text-muted-foreground text-center mb-6">C'est rapide et facile.</p>

              <form onSubmit={handleSignup} className="space-y-3">
                <Input
                  placeholder="Nom complet"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="h-12 text-base"
                />
                <Input
                  type="email"
                  placeholder="Adresse e-mail"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="h-12 text-base"
                />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="h-12 text-base"
                />
                <Input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="h-12 text-base"
                />
                <Button type="submit" className="w-full h-12 text-lg font-bold">
                  S'inscrire
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Vous avez déjà un compte ?{" "}
                <button onClick={() => navigate("/login")} className="text-primary font-semibold hover:underline">
                  Se connecter
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-3">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Découvrez les fonctionnalités qui rendent notre réseau social unique.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <PenSquare className="w-7 h-7 text-primary" />,
                title: "Publier",
                desc: "Partagez vos pensées, photos et vidéos avec votre communauté.",
                bg: "bg-primary/10",
              },
              {
                icon: <Heart className="w-7 h-7 text-destructive" />,
                title: "Interagir",
                desc: "Likez, commentez et partagez les publications de vos amis.",
                bg: "bg-destructive/10",
              },
              {
                icon: <MessageSquare className="w-7 h-7 text-secondary" />,
                title: "Discuter",
                desc: "Envoyez des messages privés à vos amis en temps réel.",
                bg: "bg-secondary/10",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE POSTS SECTION */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground text-center mb-3">
            Aperçu du fil d'actualité
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            Voici à quoi ressemble votre expérience sur notre réseau.
          </p>

          <div className="space-y-4">
            {[
              {
                name: "Sophie Martin",
                avatar: "https://i.pravatar.cc/150?img=5",
                time: "Il y a 2 heures",
                text: "Quelle belle journée ! 🌞 J'ai passé un moment incroyable au parc avec mes amis. La vie est belle quand on est bien entouré ! #bonheur",
                image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop",
                likes: 42,
                comments: 8,
              },
              {
                name: "Lucas Dupont",
                avatar: "https://i.pravatar.cc/150?img=8",
                time: "Il y a 5 heures",
                text: "Je viens de terminer mon nouveau projet ! 🚀 Tellement fier du résultat. Merci à tous ceux qui m'ont soutenu pendant ces mois de travail acharné.",
                image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
                likes: 128,
                comments: 23,
              },
            ].map((post, i) => (
              <div
                key={i}
                className="bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-fade-in"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.avatar} />
                      <AvatarFallback>{post.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{post.name}</p>
                      <p className="text-xs text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground mb-3 leading-relaxed">{post.text}</p>
                </div>
                <img src={post.image} alt="" className="w-full h-64 object-cover" />
                <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-b border-border">
                  <span>👍 {post.likes}</span>
                  <span>{post.comments} commentaires</span>
                </div>
                <div className="flex">
                  {[
                    { icon: <ThumbsUp className="w-4 h-4" />, label: "J'aime" },
                    { icon: <MessageCircle className="w-4 h-4" />, label: "Commenter" },
                    { icon: <Share2 className="w-4 h-4" />, label: "Partager" },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button onClick={() => navigate("/login")} size="lg" className="font-bold px-8">
              Rejoindre maintenant <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-4">
            <a href="#" className="hover:text-foreground transition-colors">À propos</a>
            <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-foreground transition-colors">Conditions</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            <a href="#" className="hover:text-foreground transition-colors">Aide</a>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            © 2026 Réseau Social. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
