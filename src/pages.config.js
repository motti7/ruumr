/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminCharter from './pages/AdminCharter';
import AdminUsers from './pages/AdminUsers';
import Banned from './pages/Banned';
import Charter from './pages/Charter';
import Chat from './pages/Chat';
import DataDeletion from './pages/DataDeletion';
import Discover from './pages/Discover';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import LikesSent from './pages/LikesSent';
import LikesYou from './pages/LikesYou';
import Matches from './pages/Matches';
import Onboarding from './pages/Onboarding';
import Permissions from './pages/Permissions';
import Privacy from './pages/Privacy';
import RuumrPlus from './pages/RuumrPlus';
import Profile from './pages/Profile';
import ProfileView from './pages/ProfileView';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Verification from './pages/Verification';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminCharter": AdminCharter,
    "AdminUsers": AdminUsers,
    "Banned": Banned,
    "Charter": Charter,
    "Chat": Chat,
    "DataDeletion": DataDeletion,
    "Discover": Discover,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "LikesSent": LikesSent,
    "LikesYou": LikesYou,
    "Matches": Matches,
    "Onboarding": Onboarding,
    "Permissions": Permissions,
    "Privacy": Privacy,
    "RuumrPlus": RuumrPlus,
    "Profile": Profile,
    "ProfileView": ProfileView,
    "Settings": Settings,
    "Terms": Terms,
    "Verification": Verification,
}

export const pagesConfig = {
    mainPage: "Discover",
    Pages: PAGES,
    Layout: __Layout,
};
