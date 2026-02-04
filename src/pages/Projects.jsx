import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Plus } from "lucide-react";

import ProjectList from "../components/projects/ProjectList";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm]);

  const loadProjects = async () => {
    setIsLoading(true);
    const data = await Project.list("-updated_date");
    setProjects(data);
    setIsLoading(false);
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.client_name?.toLowerCase().includes(term) ||
        p.mcst_school_name?.toLowerCase().includes(term) ||
        p.contact_person?.toLowerCase().includes(term) ||
        p.site_address?.toLowerCase().includes(term)
      );
    }

    setFilteredProjects(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              All Projects
            </h1>
            <p className="text-gray-600">
              Manage and track all your playground construction projects
            </p>
          </div>
          <Link to={createPageUrl("CreateProject")}>
            <Button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by client, MCST, contact, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Project List */}
        <ProjectList 
          projects={filteredProjects} 
          isLoading={isLoading}
          onUpdate={loadProjects}
        />
      </div>
    </div>
  );
}