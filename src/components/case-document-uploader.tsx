'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addDocumentToCase, getSummary } from '@/lib/actions';
import { Loader2, Wand2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CaseDocumentUploader({ caseId }: { caseId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

    setIsSummarizing(true);
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
          title: 'Erreur de Synthèse',
          description: result.error,
        });
      }
      setIsSummarizing(false);
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de lecture',
        description: 'Impossible de lire le fichier sélectionné.',
      });
      setIsSummarizing(false);
    };
  };

  const handleUploadDocument = async () => {
    if (!file) {
       toast({
        variant: 'destructive',
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez sélectionner un document à charger.',
      });
      return;
    }

    setIsUploading(true);
    try {
        await addDocumentToCase(caseId, { name: file.name, url: '#' }); // In a real app, this would be a real URL
        toast({
            title: 'Document ajouté',
            description: 'Le document a été ajouté à l\'affaire.'
        });
        setFile(null);
        setSummary('');
        router.refresh();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erreur de chargement',
            description: 'Impossible de charger le document.'
        })
    } finally {
        setIsUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          Analyse & Chargement de Document
        </CardTitle>
        <CardDescription>
          Chargez un document pour l'ajouter à l'affaire et/ou générer un résumé par l'IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-upload">Document</Label>
          <Input id="document-upload" type="file" onChange={handleFileChange} className="file:text-primary file:font-semibold" />
        </div>
        <div className='flex flex-wrap gap-2'>
            <Button onClick={handleUploadDocument} disabled={isUploading || !file}>
            {isUploading ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
                </>
            ) : (
                <>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter à l'affaire
                </>
            )}
            </Button>
            <Button onClick={handleGenerateSummary} disabled={isSummarizing || !file} variant="outline">
            {isSummarizing ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
                </>
            ) : (
                <>
                <Wand2 className="mr-2 h-4 w-4" />
                Générer la synthèse
                </>
            )}
            </Button>
        </div>
        {summary && (
          <div className="space-y-2 pt-4">
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
