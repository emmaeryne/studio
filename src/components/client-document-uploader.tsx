"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addDocumentToCase } from '@/lib/actions';
import { Loader2, Upload, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Case } from '@/lib/data';

export function ClientDocumentUploader({ caseItem }: { caseItem: Case }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
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
        // In a real app, this would upload to a storage bucket and return a real URL
        const fakeUrl = URL.createObjectURL(file); 
        await addDocumentToCase(caseItem.id, { name: file.name, url: fakeUrl });
        toast({
            title: 'Document ajouté',
            description: 'Le document a été ajouté à l\'affaire.'
        });
        setFile(null);
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
            <FileText className="h-5 w-5 text-primary"/>
            Ajouter un Document
        </CardTitle>
        <CardDescription>
          Chargez un document pour l'ajouter à votre affaire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-document-upload">Nouveau Document</Label>
          <Input id="client-document-upload" type="file" onChange={handleFileChange} className="file:text-primary file:font-semibold" />
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
        </div>
      </CardContent>
    </Card>
  );
}
