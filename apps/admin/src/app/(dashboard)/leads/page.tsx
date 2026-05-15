'use client';

import { useState } from 'react';
import { useLeadsKanban, useUpdateLeadStage, useCreateLead } from '@/hooks/use-leads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Phone, Building } from 'lucide-react';
import { LeadFormDialog } from '@/components/leads/lead-form-dialog';

const STAGES = [
  { key: 'NEW_LEAD', label: 'New Lead', color: 'bg-blue-500' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-500' },
  { key: 'SITE_INSPECTION', label: 'Site Inspection', color: 'bg-orange-500' },
  { key: 'QUOTATION_SENT', label: 'Quotation Sent', color: 'bg-purple-500' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-indigo-500' },
  { key: 'CLOSED_WON', label: 'Closed Won', color: 'bg-green-500' },
  { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-500' },
];

export default function LeadsPage() {
  const { data: res, isLoading } = useLeadsKanban();
  const updateStage = useUpdateLeadStage();
  const [showCreate, setShowCreate] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const kanbanData = res?.data ?? res ?? {};

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (draggedId) {
      updateStage.mutate({ id: draggedId, stage });
      setDraggedId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const leads = kanbanData[stage.key] ?? [];
          return (
            <div
              key={stage.key}
              className="min-w-[280px] flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-medium">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {leads.length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                {leads.map((lead: any) => (
                  <Card
                    key={lead.id}
                    className="cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <p className="font-medium text-sm">{lead.contactPerson}</p>
                      {lead.companyName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building className="h-3 w-3" />
                          {lead.companyName}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </div>
                      {lead.estimatedValue && (
                        <p className="text-xs font-medium text-green-600">
                          RM{lead.estimatedValue.toLocaleString()}
                        </p>
                      )}
                      {lead.assignedTo && (
                        <p className="text-xs text-muted-foreground">
                          Assigned: {lead.assignedTo.fullName}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <LeadFormDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
