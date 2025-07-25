"use client";
import Link from "next/link";
import { cases } from "@/lib/data";

// Define the Case type based on your data structure
type Case = {
  id: string;
  caseNumber: string;
  clientName: string;
  caseType: string;
  status: string;
  submittedDate: string;
  lastUpdate: string;
};
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ArrowUpRight,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AddCaseDialog } from "@/components/add-case-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Case>("submittedDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const casesPerPage = 10;
  const { toast } = useToast();

  // Filter cases by search term and status
  const filteredCases = cases
    .filter((caseItem) => {
      const matchesSearch =
        caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.caseType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || caseItem.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const isAsc = sortOrder === "asc";
      if (sortField === "submittedDate" || sortField === "lastUpdate") {
        return isAsc
          ? new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
          : new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime();
      }
      // Only string fields are sorted here
      const aValue = a[sortField];
      const bValue = b[sortField];
      return isAsc
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / casesPerPage);
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * casesPerPage,
    currentPage * casesPerPage
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Nouveau":
        return "destructive";
      case "En cours":
        return "default";
      case "Clôturé":
        return "secondary";
      case "En attente du client":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleSort = (field: keyof Case) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        {/* Header and Add Case Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-headline font-bold">
            Gestion des Affaires
          </h1>
          <AddCaseDialog>
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle Affaire
            </Button>
          </AddCaseDialog>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro, client ou type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Rechercher des affaires"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Nouveau">Nouveau</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Clôturé">Clôturé</SelectItem>
              <SelectItem value="En attente du client">
                En attente du client
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cases Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">
              Toutes les affaires
            </CardTitle>
            <CardDescription>
              Consultez, gérez et mettez à jour toutes vos affaires en cours et archivées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("caseNumber" as keyof Case)}>
                    Numéro d'affaire {sortField === "caseNumber" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("clientName" as keyof Case)}>
                    Client {sortField === "clientName" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("caseType" as keyof Case)}>
                    Type {sortField === "caseType" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("lastUpdate" as keyof Case)}>
                    Dernière mise à jour {sortField === "lastUpdate" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucune affaire trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCases.map((caseItem) => (
                    <TableRow key={caseItem.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                      <TableCell>{caseItem.clientName}</TableCell>
                      <TableCell>{caseItem.caseType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(caseItem.status)}
                          className={`${
                            caseItem.status === "En cours"
                              ? "bg-primary/20 text-primary hover:bg-primary/30"
                              : ""
                          } transition-colors`}
                        >
                          {caseItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(caseItem.lastUpdate).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-primary hover:text-primary-foreground"
                            aria-label={`Gérer l'affaire ${caseItem.caseNumber}`}
                            asChild
                          >
                          <Link href={`/dashboard/cases/${caseItem.id}`}>
                            Gérer
                            <ArrowUpRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {(currentPage - 1) * casesPerPage + 1} à{" "}
              {Math.min(currentPage * casesPerPage, filteredCases.length)} sur{" "}
              {filteredCases.length} affaires
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
