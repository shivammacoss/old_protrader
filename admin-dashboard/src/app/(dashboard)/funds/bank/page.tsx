"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface BankDetail {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  branchName: string;
  swiftCode?: string;
  status: "active" | "inactive";
}

export default function BankPage() {
  const [banks, setBanks] = useState<BankDetail[]>([
    {
      id: "1",
      bankName: "HDFC Bank",
      accountNumber: "50200012345678",
      accountHolderName: "PROTRADER Financial Services",
      ifscCode: "HDFC0001234",
      branchName: "Mumbai Main Branch",
      swiftCode: "HDFCINBB",
      status: "active",
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BankDetail>>({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
    branchName: "",
    swiftCode: "",
    status: "active",
  });

  const handleAdd = () => {
    if (
      formData.bankName &&
      formData.accountNumber &&
      formData.accountHolderName &&
      formData.ifscCode &&
      formData.branchName
    ) {
      const newBank: BankDetail = {
        id: Date.now().toString(),
        bankName: formData.bankName!,
        accountNumber: formData.accountNumber!,
        accountHolderName: formData.accountHolderName!,
        ifscCode: formData.ifscCode!,
        branchName: formData.branchName!,
        swiftCode: formData.swiftCode,
        status: formData.status || "active",
      };
      setBanks([...banks, newBank]);
      resetForm();
    }
  };

  const handleEdit = (bank: BankDetail) => {
    setEditingId(bank.id);
    setFormData(bank);
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (editingId) {
      setBanks(
        banks.map((bank) =>
          bank.id === editingId ? { ...bank, ...formData } : bank
        )
      );
      resetForm();
    }
  };

  const handleDelete = (id: string) => {
    setBanks(banks.filter((bank) => bank.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setBanks(
      banks.map((bank) =>
        bank.id === id
          ? { ...bank, status: bank.status === "active" ? "inactive" : "active" }
          : bank
      )
    );
  };

  const resetForm = () => {
    setFormData({
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      ifscCode: "",
      branchName: "",
      swiftCode: "",
      status: "active",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bank Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage bank accounts for user deposits
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Account
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <Card className="p-6 bg-card border-border">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Bank Account" : "Add New Bank Account"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Bank Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.bankName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="Enter bank name"
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Account Number <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.accountNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                placeholder="Enter account number"
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Account Holder Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.accountHolderName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, accountHolderName: e.target.value })
                }
                placeholder="Enter account holder name"
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                IFSC Code <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ifscCode || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })
                }
                placeholder="Enter IFSC code"
                className="bg-secondary border-border"
                maxLength={11}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Branch Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.branchName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, branchName: e.target.value })
                }
                placeholder="Enter branch name"
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">SWIFT Code</label>
              <Input
                value={formData.swiftCode || ""}
                onChange={(e) =>
                  setFormData({ ...formData, swiftCode: e.target.value.toUpperCase() })
                }
                placeholder="Enter SWIFT code (optional)"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Button
              onClick={editingId ? handleUpdate : handleAdd}
              className="bg-primary hover:bg-primary/90"
            >
              <Check className="w-4 h-4 mr-2" />
              {editingId ? "Update" : "Add"} Bank Account
            </Button>
            <Button onClick={resetForm} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Bank Accounts</h2>
        {banks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No bank accounts added yet. Click "Add Bank Account" to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="p-4 border border-border rounded-lg bg-secondary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                      <p className="text-sm font-medium">{bank.bankName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                      <p className="text-sm font-medium font-mono">{bank.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Account Holder</p>
                      <p className="text-sm font-medium">{bank.accountHolderName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">IFSC Code</p>
                      <p className="text-sm font-medium font-mono">{bank.ifscCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Branch</p>
                      <p className="text-sm font-medium">{bank.branchName}</p>
                    </div>
                    {bank.swiftCode && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">SWIFT Code</p>
                        <p className="text-sm font-medium font-mono">{bank.swiftCode}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          bank.status === "active"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {bank.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => handleToggleStatus(bank.id)}
                      variant="outline"
                      size="sm"
                      className={`${
                        bank.status === "active"
                          ? "hover:bg-red-500/10 hover:text-red-500"
                          : "hover:bg-green-500/10 hover:text-green-500"
                      }`}
                    >
                      {bank.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      onClick={() => handleEdit(bank)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(bank.id)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
