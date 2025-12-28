import AdminAnalytics from './pages/AdminAnalytics';
import AdminUsers from './pages/AdminUsers';
import Banned from './pages/Banned';
import Chat from './pages/Chat';
import Discover from './pages/Discover';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import LikesSent from './pages/LikesSent';
import LikesYou from './pages/LikesYou';
import Matches from './pages/Matches';
import Onboarding from './pages/Onboarding';
import Permissions from './pages/Permissions';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ProfileView from './pages/ProfileView';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Verification from './pages/Verification';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAnalytics": AdminAnalytics,
    "AdminUsers": AdminUsers,
    "Banned": Banned,
    "Chat": Chat,
    "Discover": Discover,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "LikesSent": LikesSent,
    "LikesYou": LikesYou,
    "Matches": Matches,
    "Onboarding": Onboarding,
    "Permissions": Permissions,
    "Privacy": Privacy,
    "Profile": Profile,
    "ProfileView": ProfileView,
    "Settings": Settings,
    "Terms": Terms,
    "Verification": Verification,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};