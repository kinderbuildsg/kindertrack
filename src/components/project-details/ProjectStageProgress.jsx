import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const stages = [
  { id: "cold_outreach", name: "Cold Outreach", icon: "📧" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "closing", name: "Closing", icon: "🤝" },
  { id: "procurement", name: "Procurement", icon: "📦" },
  { id: "work", name: "Installation", icon: "🔨" },
  { id: "completion", name: "Completion", icon: "✅" },
  { id: "post_maintenance", name: "Maintenance", icon: "🔧" }
];

export default function ProjectStageProgress({ project, onStageChange }) {
  const [warnings, setWarnings] = useState([]);
  const currentStageIndex = stages.findIndex((s) => s.id === project.stage);
  const currentStage = stages[currentStageIndex];

  const validateStageChange = (newStageId) => {
    const validationWarnings = [];

    // Validate: Cannot move to Procurement without 40% payment
    if (newStageId === 'procurement' && !project.payment_40_received) {
      validationWarnings.push("⚠️ 40% initial payment has not been received");
    }

    // Validate: Cannot move to Work without 30% payment
    if (newStageId === 'work' && !project.payment_30_received) {
      validationWarnings.push("⚠️ 30% payment required before starting installation work");
    }

    // Validate: Completion requires final payment
    if (newStageId === 'completion' && !project.payment_30_final_received) {
      validationWarnings.push("⚠️ Final 30% payment should be received before marking as complete");
    }

    // Validate: Closing stage should have estimated value
    if (newStageId === 'closing' && !project.estimated_value) {
      validationWarnings.push("⚠️ Project estimated value is not set");
    }

    return validationWarnings;
  };

  const handleStageClick = (newStageId) => {
    if (newStageId === project.stage) return;

    const validationWarnings = validateStageChange(newStageId);
    setWarnings(validationWarnings);

    // If there are blocking warnings for critical stages, we still allow the change but show warnings
    onStageChange(newStageId);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress Bar */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-500"
              style={{ width: `${currentStageIndex / (stages.length - 1) * 100}%` }}
            />
          </div>

          {/* Stages */}
          <div className="relative grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const stageWarnings = validateStageChange(stage.id);

              return (
                <AlertDialog key={stage.id}>
                  <AlertDialogTrigger asChild>
                    <button
                      className="flex flex-col items-center text-center cursor-pointer group disabled:cursor-not-allowed relative"
                      disabled={isCurrent}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted ? 'bg-green-500 border-green-500' :
                        isCurrent ? 'bg-sky-500 border-sky-500 ring-4 ring-sky-100' :
                        'bg-white border-gray-300 group-hover:border-sky-400'
                      }`}>
                        {isCompleted ?
                          <CheckCircle className="w-6 h-6 text-white" /> :
                          <span className="text-xl">{stage.icon}</span>
                        }
                      </div>
                      {stageWarnings.length > 0 && !isCurrent && (
                        <AlertTriangle className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
                      )}
                      <p className={`mt-2 text-xs font-medium ${
                        isCurrent ? 'text-sky-600' : 'text-gray-600 group-hover:text-sky-600'
                      }`}>
                        {stage.name}
                      </p>
                      {isCurrent &&
                        <div className="mt-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">
                          Current
                        </div>
                      }
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-50 p-6 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-lg duration-200 sm:rounded-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Change Project Stage?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to move this project from '{currentStage.name}' to '{stage.name}'?
                      </AlertDialogDescription>
                      {stageWarnings.length > 0 && (
                        <Alert className="mt-4 border-amber-300 bg-amber-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              {stageWarnings.map((warning, idx) => (
                                <div key={idx} className="text-sm">{warning}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleStageClick(stage.id)}>
                        {stageWarnings.length > 0 ? 'Proceed Anyway' : 'Confirm & Move'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}