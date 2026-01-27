import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import Team from './pages/Team';
import ProjectDetails from './pages/ProjectDetails';
import SurveyManagement from './pages/SurveyManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "CreateProject": CreateProject,
    "Team": Team,
    "ProjectDetails": ProjectDetails,
    "SurveyManagement": SurveyManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};