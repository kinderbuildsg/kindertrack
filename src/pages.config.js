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
import ChangePassword from './pages/ChangePassword';
import ColdCalling from './pages/ColdCalling';
import CreateProject from './pages/CreateProject';
import Dashboard from './pages/Dashboard';
import LeadManagement from './pages/LeadManagement';
import PendingApproval from './pages/PendingApproval';
import ProjectDetails from './pages/ProjectDetails';
import Projects from './pages/Projects';
import Team from './pages/Team';
import TemplateManagement from './pages/TemplateManagement';
import UserManagement from './pages/UserManagement';
import SiteEvaluationPage from './pages/SiteEvaluationPage';
import DesignProposalPage from './pages/DesignProposalPage';
import DealClosedPage from './pages/DealClosedPage';
import ProcurementPage from './pages/ProcurementPage';
import WorkProgressPage from './pages/WorkProgressPage';
import CompletionPage from './pages/CompletionPage';
import MaintenancePage from './pages/MaintenancePage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ChangePassword": ChangePassword,
    "ColdCalling": ColdCalling,
    "CreateProject": CreateProject,
    "Dashboard": Dashboard,
    "LeadManagement": LeadManagement,
    "PendingApproval": PendingApproval,
    "ProjectDetails": ProjectDetails,
    "Projects": Projects,
    "Team": Team,
    "TemplateManagement": TemplateManagement,
    "UserManagement": UserManagement,
    "SiteEvaluationPage": SiteEvaluationPage,
    "DesignProposalPage": DesignProposalPage,
    "DealClosedPage": DealClosedPage,
    "ProcurementPage": ProcurementPage,
    "WorkProgressPage": WorkProgressPage,
    "CompletionPage": CompletionPage,
    "MaintenancePage": MaintenancePage,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};