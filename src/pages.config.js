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
import CreateProject from './pages/CreateProject';
import Dashboard from './pages/Dashboard';
import LeadManagement from './pages/LeadManagement';
import ProjectDetails from './pages/ProjectDetails';
import Projects from './pages/Projects';
import SurveyManagement from './pages/SurveyManagement';
import Team from './pages/Team';
import TemplateManagement from './pages/TemplateManagement';
import UserManagement from './pages/UserManagement';
import ChangePassword from './pages/ChangePassword';
import PendingApproval from './pages/PendingApproval';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreateProject": CreateProject,
    "Dashboard": Dashboard,
    "LeadManagement": LeadManagement,
    "ProjectDetails": ProjectDetails,
    "Projects": Projects,
    "SurveyManagement": SurveyManagement,
    "Team": Team,
    "TemplateManagement": TemplateManagement,
    "UserManagement": UserManagement,
    "ChangePassword": ChangePassword,
    "PendingApproval": PendingApproval,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};