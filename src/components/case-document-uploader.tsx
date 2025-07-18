'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSummary } from '@/lib/actions';
import { Loader2, Wand2 } from 'lucide-react';

export function CaseDocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSummary('');
    }
  };

  const handleGenerateSummary = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez sélectionner un document à analyser.',
      });
      return;
    }

    setIsLoading(true);
    setSummary('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const documentDataUri = reader.result as string;
      const result = await getSummary({ documentDataUri });

      if (result.success && result.summary) {
        setSummary(result.summary);
        toast({
          title: 'Résumé généré',
          description: 'Le résumé du document a été créé avec succès.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.error,
        });
      }
      setIsLoading(false);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de lecture',
        description: 'Impossible de lire le fichier sélectionné.',
      });
      setIsLoading(false);
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Wand2 className="text-accent" />
          Synthèse par IA
        </CardTitle>
        <CardDescription>
          Chargez un document pour obtenir un résumé rapide des points clés généré par l'IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-upload">Charger un document</Label>
          <Input id="document-upload" type="file" onChange={handleFileChange} />
        </div>
        <Button onClick={handleGenerateSummary} disabled={isLoading || !file}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Générer la synthèse
            </>
          )}
        </Button>
        {summary && (
          <div className="space-y-2">
            <Label htmlFor="summary-output">Résumé du document</Label>
            <Textarea
              id="summary-output"
              readOnly
              value={summary}
              rows={10}
              className="bg-secondary"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
