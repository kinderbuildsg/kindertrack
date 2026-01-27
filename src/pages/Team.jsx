import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


export default function Team() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [userData, currentUserData] = await Promise.all([
        User.list(),
        User.me()
      ]);
      setUsers(userData);
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setIsLoading(false);
  };

  const handleRoleChange = async (userToUpdate, newRole) => {
    try {
      await User.update(userToUpdate.id, { role: newRole });
      // Refresh the list to show the change
      loadUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("You do not have permission to change user roles.");
    }
  };

  const roleColors = {
    admin: "bg-purple-100 text-purple-800",
    sales: "bg-blue-100 text-blue-800",
    worker: "bg-orange-100 text-orange-800",
    designer: "bg-cyan-100 text-cyan-800",
    user: "bg-blue-100 text-blue-800" // Fallback for old 'user' role
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Team Members
          </h1>
          <p className="text-gray-600">
            Manage your team and their roles in KinderTrack
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-40" />
              </Card>
            ))
          ) : (
            users.map(user => (
              <Card key={user.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{user.full_name}</CardTitle>
                      <Badge className={roleColors[user.role] || roleColors.user}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        You
                      </Badge>
                    )}
                  </div>

                  {currentUser?.role === 'admin' && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-xs text-gray-500">Manage Role</Label>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user, newRole)}
                        disabled={user.id === currentUser.id}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!isLoading && users.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No team members found</p>
          </div>
        )}
      </div>
    </div>
  );
}