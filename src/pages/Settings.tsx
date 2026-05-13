import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Shield, Lock, Bell, Globe, FileText, Ban, AppWindow, Moon, HelpCircle, ChevronLeft, Trash2, PowerOff, Camera, Smartphone, Monitor, Laptop, X } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { id: "account", icon: User, label: "Paramètres du compte" },
  { id: "security", icon: Shield, label: "Sécurité et connexion" },
  { id: "privacy", icon: Lock, label: "Confidentialité" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "language", icon: Globe, label: "Langue et région" },
  { id: "posts", icon: FileText, label: "Paramètres des publications" },
  { id: "blocking", icon: Ban, label: "Blocage" },
  { id: "apps", icon: AppWindow, label: "Applications et sites web" },
  { id: "darkmode", icon: Moon, label: "Mode sombre" },
  { id: "help", icon: HelpCircle, label: "Aide et support" },
];

const Settings = () => {
  const [isReady, setIsReady] = useState(false);
  const [activeSection, setActiveSection] = useState("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user] = useState({
    name: "Utilisateur Demo",
    firstName: "Utilisateur",
    avatar: "https://i.pravatar.cc/150?img=3",
  });

  // Form states
  const [accountForm, setAccountForm] = useState({ firstName: "Utilisateur", lastName: "Demo", email: "user@demo.com", phone: "+33 6 12 34 56 78", username: "utilisateur.demo" });
  const [notifications, setNotifications] = useState({ comments: true, likes: true, messages: true, friends: true, groups: false });
  const [privacy, setPrivacy] = useState({ posts: "friends", friendsList: "friends", profile: "public", stories: "friends" });
  const [postSettings, setPostSettings] = useState({ whoCanComment: "friends", whoCanShare: "friends", commentsEnabled: true });

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) await supabase.auth.signInAnonymously();
      setIsReady(true);
    };
    check();
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    toast({ title: next ? "Mode sombre activé" : "Mode clair activé" });
  };

  const handleSave = () => {
    toast({ title: "Modifications sauvegardées", description: "Vos paramètres ont été mis à jour." });
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Paramètres du compte</h2>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
              <div className="relative group cursor-pointer">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">Modifier la photo de profil</p>
              </div>
            </div>
            <div className="grid gap-4">
              {[
                { label: "Prénom", key: "firstName" as const },
                { label: "Nom", key: "lastName" as const },
                { label: "Nom d'utilisateur", key: "username" as const },
                { label: "Email", key: "email" as const },
                { label: "Téléphone", key: "phone" as const },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-foreground mb-1 block">{field.label}</label>
                  <Input value={accountForm[field.key]} onChange={(e) => setAccountForm({ ...accountForm, [field.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <Button onClick={handleSave} className="w-full sm:w-auto">Sauvegarder les modifications</Button>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Sécurité et connexion</h2>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <h3 className="font-semibold text-foreground">Changer le mot de passe</h3>
                <Input type="password" placeholder="Mot de passe actuel" />
                <Input type="password" placeholder="Nouveau mot de passe" />
                <Input type="password" placeholder="Confirmer le nouveau mot de passe" />
                <Button onClick={handleSave}>Mettre à jour</Button>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Authentification à deux facteurs</h3>
                    <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <h3 className="font-semibold text-foreground">Appareils connectés</h3>
                {[
                  { icon: Monitor, name: "Chrome — Windows", location: "Paris, France", date: "Actif maintenant" },
                  { icon: Smartphone, name: "Safari — iPhone", location: "Lyon, France", date: "Il y a 2 heures" },
                  { icon: Laptop, name: "Firefox — MacOS", location: "Marseille, France", date: "Il y a 3 jours" },
                ].map((device, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <device.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.location} · {device.date}</p>
                    </div>
                    {i > 0 && <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Déconnecter</Button>}
                  </div>
                ))}
              </div>
              <Button variant="destructive" className="w-full">Se déconnecter de tous les appareils</Button>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Confidentialité</h2>
            {[
              { label: "Qui peut voir mes publications", key: "posts" as const },
              { label: "Qui peut voir ma liste d'amis", key: "friendsList" as const },
              { label: "Qui peut voir mon profil", key: "profile" as const },
              { label: "Qui peut voir mes stories", key: "stories" as const },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <span className="font-medium text-foreground">{item.label}</span>
                <Select value={privacy[item.key]} onValueChange={(v) => setPrivacy({ ...privacy, [item.key]: v })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Amis</SelectItem>
                    <SelectItem value="only_me">Moi uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            {[
              { label: "Commentaires", key: "comments" as const },
              { label: "J'aime", key: "likes" as const },
              { label: "Messages", key: "messages" as const },
              { label: "Demandes d'amis", key: "friends" as const },
              { label: "Groupes", key: "groups" as const },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <span className="font-medium text-foreground">{item.label}</span>
                <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
              </div>
            ))}
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        );

      case "language":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Langue et région</h2>
            {[
              { label: "Langue", options: [{ v: "fr", l: "Français" }, { v: "en", l: "English" }, { v: "ar", l: "العربية" }, { v: "es", l: "Español" }], defaultVal: "fr" },
              { label: "Région", options: [{ v: "fr", l: "France" }, { v: "us", l: "États-Unis" }, { v: "ma", l: "Maroc" }, { v: "ca", l: "Canada" }], defaultVal: "fr" },
              { label: "Format de date", options: [{ v: "dmy", l: "JJ/MM/AAAA" }, { v: "mdy", l: "MM/JJ/AAAA" }, { v: "ymd", l: "AAAA/MM/JJ" }], defaultVal: "dmy" },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-muted rounded-xl">
                <label className="text-sm font-medium text-foreground mb-2 block">{item.label}</label>
                <Select defaultValue={item.defaultVal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {item.options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        );

      case "posts":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Paramètres des publications</h2>
            {[
              { label: "Qui peut commenter mes publications", key: "whoCanComment" as const },
              { label: "Qui peut partager mes publications", key: "whoCanShare" as const },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <span className="font-medium text-foreground">{item.label}</span>
                <Select value={postSettings[item.key]} onValueChange={(v) => setPostSettings({ ...postSettings, [item.key]: v })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Amis</SelectItem>
                    <SelectItem value="only_me">Moi uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <span className="font-medium text-foreground">Activer les commentaires</span>
              <Switch checked={postSettings.commentsEnabled} onCheckedChange={(v) => setPostSettings({ ...postSettings, commentsEnabled: v })} />
            </div>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        );

      case "blocking":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Blocage</h2>
            <div className="p-4 bg-muted rounded-xl">
              <label className="text-sm font-medium text-foreground mb-2 block">Bloquer un utilisateur</label>
              <div className="flex gap-2">
                <Input placeholder="Nom ou email de l'utilisateur" className="flex-1" />
                <Button>Bloquer</Button>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Utilisateurs bloqués</h3>
              {[
                { name: "Jean Dupont", avatar: "https://i.pravatar.cc/150?img=12" },
                { name: "Marie Martin", avatar: "https://i.pravatar.cc/150?img=20" },
              ].map((u) => (
                <div key={u.name} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium text-foreground">{u.name}</span>
                  <Button variant="outline" size="sm">Débloquer</Button>
                </div>
              ))}
            </div>
          </div>
        );

      case "apps":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Applications et sites web</h2>
            {[
              { name: "Spotify", desc: "Accès à votre profil et email", icon: "🎵" },
              { name: "Instagram", desc: "Partage de photos", icon: "📸" },
              { name: "TikTok", desc: "Accès au profil", icon: "🎬" },
            ].map((app) => (
              <div key={app.name} className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-2xl shadow-sm">{app.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{app.name}</p>
                  <p className="text-sm text-muted-foreground">{app.desc}</p>
                </div>
                <Button variant="destructive" size="sm">Supprimer</Button>
              </div>
            ))}
          </div>
        );

      case "darkmode":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Mode sombre</h2>
            <div className="p-6 bg-muted rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center shadow-sm">
                  <Moon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{darkMode ? "Mode sombre activé" : "Mode clair activé"}</p>
                  <p className="text-sm text-muted-foreground">Basculer l'apparence de l'interface</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Aide et support</h2>
            {[
              { title: "FAQ", desc: "Trouvez des réponses aux questions fréquentes" },
              { title: "Contacter le support", desc: "Envoyez-nous un message" },
              { title: "Signaler un problème", desc: "Aidez-nous à améliorer la plateforme" },
            ].map((item) => (
              <button key={item.title} className="w-full text-left p-4 bg-muted rounded-xl hover:bg-accent transition-colors">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </button>
            ))}
            <div className="border-t border-border pt-6 space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground">
                    <PowerOff className="w-4 h-4" /> Désactiver mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Désactiver votre compte ?</AlertDialogTitle>
                    <AlertDialogDescription>Votre compte sera temporairement désactivé. Vous pourrez le réactiver en vous reconnectant.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction>Désactiver</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start gap-2">
                    <Trash2 className="w-4 h-4" /> Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
                    <AlertDialogDescription>Cette action est irréversible. Toutes vos données seront supprimées.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const activeItem = menuItems.find((m) => m.id === activeSection);

  return (
    <div className="min-h-screen bg-muted pb-14 lg:pb-0">
      <DashboardNavbar user={user} />
      <div className="pt-14 max-w-5xl mx-auto px-2 sm:px-3 py-4 sm:py-6">
        {/* Mobile header */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Paramètres</h1>
        </div>

        <div className="flex gap-4">
          {/* Sidebar */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="bg-card rounded-xl shadow-sm border border-border p-3 sticky top-20">
              <h1 className="text-xl font-bold text-foreground px-3 py-2 mb-1">Paramètres</h1>
              <nav className="space-y-0.5">
                {menuItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile menu */}
          <div className="lg:hidden w-full">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between p-3 bg-card rounded-xl shadow-sm border border-border mb-4"
            >
              <div className="flex items-center gap-3">
                {activeItem && <activeItem.icon className="w-5 h-5 text-primary" />}
                <span className="font-medium text-foreground">{activeItem?.label}</span>
              </div>
              <ChevronLeft className={`w-5 h-5 text-muted-foreground transition-transform ${mobileMenuOpen ? "rotate-90" : "-rotate-90"}`} />
            </button>
            {mobileMenuOpen && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-2 mb-4 animate-scale-in">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeSection === item.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;
