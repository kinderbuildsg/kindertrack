import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Shield, User, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import { inviteUserWithPassword } from "@/functions/inviteUserWithPassword";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [invitePassword, setInvitePassword] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUserData, usersData] = await Promise.all([
        base44.auth.me(),
        base44.entities.User.list()
      ]);
      
      setCurrentUser(currentUserData);
      setUsers(usersData);
      setPendingUsers(usersData.filter(u => u.approval_status === "pending"));
      setApprovedUsers(usersData.filter(u => u.approval_status === "approved" || !u.approval_status));
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load users");
    }
    setIsLoading(false);
  };

  const handleApprove = async (userId, userName, userEmail) => {
    try {
      await base44.entities.User.update(userId, {
        approval_status: "approved",
        approved_by: currentUser.email,
        approved_date: new Date().toISOString()
      });

      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: "Your Kinderbuild Projects Account Has Been Approved",
        body: `Hello ${userName},

Good news! Your Kinderbuild Projects account has been approved.

You can now log in and start using the application.

Best regards,
Kinderbuild Projects Team`
      });

      toast.success(`${userName} has been approved`);
      await loadData();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
    }
  };

  const handleReject = async (userId, userName, userEmail) => {
    const reason = prompt("Reason for rejection (optional):");
    
    try {
      await base44.entities.User.update(userId, {
        approval_status: "rejected",
        rejection_reason: reason || "No reason provided"
      });

      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: "Kinderbuild Projects Account Update",
        body: `Hello ${userName},

Unfortunately, your Kinderbuild Projects account application has been declined.

${reason ? `Reason: ${reason}` : ''}

If you have questions, please contact an administrator.

Best regards,
Kinderbuild Projects Team`
      });

      toast.success(`${userName} has been rejected`);
      await loadData();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user");
    }
  };

  const handleUpdateRole = async (userId, newJobRole) => {
    try {
      await base44.entities.User.update(userId, {
        job_role: newJobRole
      });
      toast.success("User role updated successfully");
      setEditingUserId(null);
      await loadData();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInvitePassword(password);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!inviteName) {
      toast.error("Please enter the user's full name");
      return;
    }

    if (!invitePassword || invitePassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsInviting(true);
    try {
      await inviteUserWithPassword({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
        temporary_password: invitePassword
      });

      // Approve the user immediately since admin created them
      const newUsers = await base44.entities.User.filter({ email: inviteEmail });
      if (newUsers.length > 0) {
        await base44.entities.User.update(newUsers[0].id, {
          approval_status: "approved",
          approved_by: currentUser.email,
          approved_date: new Date().toISOString()
        });
      }
      toast.success(`User created and credentials sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setInviteRole("user");
      await loadData();
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error(error.message || "Failed to invite user");
    }
    setIsInviting(false);
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Invite and manage users in your organization</p>
        </div>

        <Card className="border-sky-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-600" />
              Invite New User
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="role">Job Role</Label>
                   <Select value={inviteRole} onValueChange={setInviteRole}>
                     <SelectTrigger id="role">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="director">Director</SelectItem>
                       <SelectItem value="sales">Sales</SelectItem>
                       <SelectItem value="telemarketer">Telemarketer</SelectItem>
                       <SelectItem value="cold_caller">Cold Caller</SelectItem>
                       <SelectItem value="designer">Designer</SelectItem>
                       <SelectItem value="finance">Finance</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      placeholder="Min 8 characters"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={generatePassword}
                      className="shrink-0"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">User will be required to change this on first login</p>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isInviting}
                className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {pendingUsers.length > 0 && (
          <Card className="shadow-lg border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-600" />
                Pending Approval ({pendingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-amber-200 rounded-lg bg-amber-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.full_name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || "No name"}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">Registered {new Date(user.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(user.id, user.full_name, user.email)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user.id, user.full_name, user.email)}
                        className="bg-gradient-to-r from-green-500 to-green-600"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Approved Users ({approvedUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.full_name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || "No name"}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.must_change_password && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 mt-1">
                          Must change password
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className={user.role === "admin" ? "bg-amber-500" : ""}
                  >
                    {user.role === "admin" ? (
                      <>
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        User
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}