import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Task } from "@/entities/Task";
import { Attachment } from "@/entities/Attachment";
import { ProjectUpdate } from "@/entities/ProjectUpdate";
import { ProcurementItem } from "@/entities/ProcurementItem";
import { PhaseNote } from "@/entities/PhaseNote";
import { User } from "@/entities/User";
import { ClientCommunication } from "@/entities/ClientCommunication";
import { useNavigate } from "react-router-dom";
import ProjectFeedback from "../components/project-details/ProjectFeedback";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ProjectHeader from "../components/project-details/ProjectHeader";
import ProjectStageProgress from "../components/project-details/ProjectStageProgress";
import ProjectPhaseNotes from "../components/project-details/ProjectPhaseNotes";
import ProjectOverview from "../components/project-details/ProjectOverview";
import ProjectTasks from "../components/project-details/ProjectTasks";
import ProjectPayments from "../components/project-details/ProjectPayments";
import ProjectFiles from "../components/project-details/ProjectFiles";
import ProjectTimeline from "../components/project-details/ProjectTimeline";
import ProjectEdit from "../components/project-details/ProjectEdit";
import ProjectProcurement from "../components/project-details/ProjectProcurement";
import ProjectCommunications from "../components/project-details/ProjectCommunications";
import FollowUpManager from "../components/follow-ups/FollowUpManager";

export default function ProjectDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [procurementItems, setProcurementItems] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      const [projectData, currentUser] = await Promise.all([
        Project.filter({ id: projectId }),
        User.me()
      ]);

      if (projectData.length > 0) {
        setProject(projectData[0]);
        await loadRelatedData(projectData[0].id);
      }
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading project:", error);
    }
    setIsLoading(false);
  };

  const loadRelatedData = async (id) => {
    try {
      const [
        tasksData, 
        attachmentsData, 
        updatesData, 
        procurementData,
        communicationsData
      ] = await Promise.all([
        Task.filter({ project_id: id }),
        Attachment.filter({ project_id: id }),
        ProjectUpdate.filter({ project_id: id }, "-created_date"),
        ProcurementItem.filter({ project_id: id }),
        ClientCommunication.filter({ project_id: id }, "-created_date")
      ]);

      setTasks(tasksData);
      setAttachments(attachmentsData);
      setUpdates(updatesData);
      setProcurementItems(procurementData);
      setCommunications(communicationsData);
    } catch (error) {
      console.error("Error loading related data:", error);
    }
  };

  const handleProjectUpdate = async (updatedData) => {
    try {
      const originalProject = { ...project };
      const updatedProject = await Project.update(project.id, updatedData);
      
      // Compare and log changes
      const changes = [];
      const keysToTrack = ['client_name', 'project_title', 'priority', 'stage', 'estimated_value'];
      keysToTrack.forEach(key => {
        if (String(originalProject[key] || '') !== String(updatedProject[key] || '')) {
          changes.push(`- Changed '${key.replace(/_/g, ' ')}' from "${originalProject[key] || 'empty'}" to "${updatedProject[key] || 'empty'}"`);
        }
      });

      if (changes.length > 0) {
        await ProjectUpdate.create({
          project_id: project.id,
          update_type: 'edit',
          content: `Project details updated:\n${changes.join('\n')}`
        });
      }

      await loadProjectData();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      const [
        tasksToDelete, 
        attachmentsToDelete, 
        updatesToDelete, 
        procurementToDelete,
        phaseNotesToDelete,
        communicationsToDelete
      ] = await Promise.all([
        Task.filter({ project_id: project.id }),
        Attachment.filter({ project_id: project.id }),
        ProjectUpdate.filter({ project_id: project.id }),
        ProcurementItem.filter({ project_id: project.id }),
        PhaseNote.filter({ project_id: project.id }),
        ClientCommunication.filter({ project_id: project.id })
      ]);

      const deletionPromises = [
        ...tasksToDelete.map(t => Task.delete(t.id)),
        ...attachmentsToDelete.map(a => Attachment.delete(a.id)),
        ...updatesToDelete.map(u => ProjectUpdate.delete(u.id)),
        ...procurementToDelete.map(p => ProcurementItem.delete(p.id)),
        ...phaseNotesToDelete.map(pn => PhaseNote.delete(pn.id)),
        ...communicationsToDelete.map(c => ClientCommunication.delete(c.id))
      ];
      
      await Promise.all(deletionPromises);
      await Project.delete(project.id);
      
      alert("Project successfully deleted.");
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error deleting project and its related data:", error);
      alert("Failed to delete the project. Please try again.");
    }
  };

  const handleStageChange = async (newStage) => {
    try {
      await Project.update(project.id, { stage: newStage });
      
      await ProjectUpdate.create({
        project_id: project.id,
        update_type: "status_change",
        content: `Project moved from ${project.stage} to ${newStage}`,
        stage_from: project.stage,
        stage_to: newStage
      });

      await loadProjectData();
    } catch (error) {
      console.error("Error changing stage:", error);
    }
  };

  const handleTaskUpdate = async () => {
    await loadRelatedData(project.id);
  };

  const handleFileUpload = async () => {
    await loadRelatedData(project.id);
  };

  const handleProcurementUpdate = async () => {
    await loadRelatedData(project.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <ProjectEdit
        project={project}
        onSave={handleProjectUpdate}
        onCancel={() => setIsEditing(false)}
        onDelete={handleDeleteProject}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </Button>
        </div>

        <ProjectHeader project={project} />

        <ProjectStageProgress 
          project={project} 
          onStageChange={handleStageChange}
        />

        <ProjectPhaseNotes project={project} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-9 bg-white shadow-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="procurement">Procurement</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="follow-ups">Follow-Ups</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ProjectOverview project={project} user={user} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <ProjectTasks 
              project={project}
              tasks={tasks}
              onUpdate={handleTaskUpdate}
            />
          </TabsContent>

          <TabsContent value="procurement" className="mt-6">
            <ProjectProcurement 
              project={project}
              items={procurementItems}
              onUpdate={handleProcurementUpdate}
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <ProjectPayments 
              project={project}
              onUpdate={handleProjectUpdate}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <ProjectFiles
              project={project}
              attachments={attachments}
              onUpload={handleFileUpload}
            />
          </TabsContent>

          <TabsContent value="communications" className="mt-6">
            <ProjectCommunications
              project={project}
              communications={communications}
              onUpdate={() => loadRelatedData(project.id)}
            />
          </TabsContent>

          <TabsContent value="follow-ups" className="mt-6">
            <FollowUpManager project={project} user={user} />
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <ProjectFeedback
              project={project}
              onUpdate={handleProjectUpdate}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <ProjectTimeline
              project={project}
              updates={updates}
              onUpdate={() => loadRelatedData(project.id)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}