import Discover from './pages/Discover';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import HelpCenter from './pages/HelpCenter';
import Terms from './pages/Terms';
import Permissions from './pages/Permissions';
import Chat from './pages/Chat';
import ProfileView from './pages/ProfileView';
import Verification from './pages/Verification';
import LikesYou from './pages/LikesYou';
import LikesSent from './pages/LikesSent';
import Banned from './pages/Banned';
import AdminUsers from './pages/AdminUsers';
import LandingPage from './pages/LandingPage';
import Privacy from './pages/Privacy';
import PostLogin from './pages/PostLogin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Discover": Discover,
    "Matches": Matches,
    "Profile": Profile,
    "Settings": Settings,
    "Home": Home,
    "Onboarding": Onboarding,
    "HelpCenter": HelpCenter,
    "Terms": Terms,
    "Permissions": Permissions,
    "Chat": Chat,
    "ProfileView": ProfileView,
    "Verification": Verification,
    "LikesYou": LikesYou,
    "LikesSent": LikesSent,
    "Banned": Banned,
    "AdminUsers": AdminUsers,
    "LandingPage": LandingPage,
    "Privacy": Privacy,
    "PostLogin": PostLogin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};