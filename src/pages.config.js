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
import CompletionPage from './pages/CompletionPage';
import CreateProject from './pages/CreateProject';
import Dashboard from './pages/Dashboard';
import DealClosedPage from './pages/DealClosedPage';
import DesignProposalPage from './pages/DesignProposalPage';
import LeadManagement from './pages/LeadManagement';
import MaintenancePage from './pages/MaintenancePage';
import ManpowerPayroll from './pages/ManpowerPayroll';
import PendingApproval from './pages/PendingApproval';
import ProcurementPage from './pages/ProcurementPage';
import ProjectDetails from './pages/ProjectDetails';
import Projects from './pages/Projects';
import SiteEvaluationPage from './pages/SiteEvaluationPage';
import Team from './pages/Team';
import TemplateManagement from './pages/TemplateManagement';
import UserManagement from './pages/UserManagement';
import WorkProgressPage from './pages/WorkProgressPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ChangePassword": ChangePassword,
    "ColdCalling": ColdCalling,
    "CompletionPage": CompletionPage,
    "CreateProject": CreateProject,
    "Dashboard": Dashboard,
    "DealClosedPage": DealClosedPage,
    "DesignProposalPage": DesignProposalPage,
    "LeadManagement": LeadManagement,
    "MaintenancePage": MaintenancePage,
    "ManpowerPayroll": ManpowerPayroll,
    "PendingApproval": PendingApproval,
    "ProcurementPage": ProcurementPage,
    "ProjectDetails": ProjectDetails,
    "Projects": Projects,
    "SiteEvaluationPage": SiteEvaluationPage,
    "Team": Team,
    "TemplateManagement": TemplateManagement,
    "UserManagement": UserManagement,
    "WorkProgressPage": WorkProgressPage,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};