import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FolderKanban, User, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ projects: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], users: [] });
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [projects, users] = await Promise.all([
          base44.entities.Project.list("-updated_date", 100),
          base44.entities.User.list()
        ]);

        const lowercaseQuery = query.toLowerCase();
        
        const filteredProjects = projects.filter(p => 
          p.client_name?.toLowerCase().includes(lowercaseQuery) ||
          p.project_title?.toLowerCase().includes(lowercaseQuery) ||
          p.contact_person?.toLowerCase().includes(lowercaseQuery) ||
          p.contact_email?.toLowerCase().includes(lowercaseQuery) ||
          p.site_address?.toLowerCase().includes(lowercaseQuery) ||
          p.project_number?.toLowerCase().includes(lowercaseQuery)
        ).slice(0, 10);

        const filteredUsers = users.filter(u =>
          u.full_name?.toLowerCase().includes(lowercaseQuery) ||
          u.email?.toLowerCase().includes(lowercaseQuery)
        ).slice(0, 5);

        setResults({ projects: filteredProjects, users: filteredUsers });
      } catch (error) {
        console.error("Search error:", error);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleProjectClick = (projectId) => {
    navigate(createPageUrl(`ProjectDetails?id=${projectId}`));
    onClose();
  };

  const totalResults = results.projects.length + results.users.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Projects & Contacts</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client, project, contact, email, or address..."
            className="pl-10"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        <ScrollArea className="h-[400px] mt-4">
          {!query.trim() ? (
            <div className="text-center text-gray-500 py-12">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Start typing to search</p>
            </div>
          ) : totalResults === 0 && !isSearching ? (
            <div className="text-center text-gray-500 py-12">
              <p>No results found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    Projects ({results.projects.length})
                  </h3>
                  <div className="space-y-2">
                    {results.projects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {project.project_title || project.client_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Client: {project.client_name}
                            </p>
                            {project.contact_person && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {project.contact_person}
                              </p>
                            )}
                            {project.site_address && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {project.site_address}
                              </p>
                            )}
                          </div>
                          <Badge className="ml-2">
                            {project.stage?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Team Members ({results.users.length})
                  </h3>
                  <div className="space-y-2">
                    {results.users.map(user => (
                      <div
                        key={user.id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <Badge variant="outline" className="mt-2">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}