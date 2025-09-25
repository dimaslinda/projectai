import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { FileSpreadsheet } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CellStyle {
    font: {
        bold: boolean;
        size: number;
        color: string;
    };
    fill: {
        color: string;
    };
    borders: {
        outline: string;
    };
}

interface CellInfo {
    coordinate: string;
    value: string;
    row: number;
    column: number;
    style: CellStyle;
}

interface ImageInfo {
    name: string;
    coordinates: string;
    width: number;
    height: number;
    offset_x: number;
    offset_y: number;
}

interface SheetAnalysis {
    name: string;
    index: number;
    dimensions: {
        rows: number;
        columns: string;
        highest_column_index: number;
    };
    content_structure: CellInfo[];
    image_placeholders: CellInfo[];
    merged_cells: string[];
    headers: CellInfo[];
    existing_images: ImageInfo[];
}

interface PhotoPosition {
    type: string;
    label?: string;
    coordinate: string;
    suggested_category?: string;
    width?: number;
    height?: number;
}

interface PhotoMapping {
    sheet_name: string;
    photo_positions: PhotoPosition[];
}

interface AnalysisData {
    file_info?: {
        filename: string;
        size: number;
        last_modified: string;
    };
    total_worksheets?: number;
    photo_mapping?: PhotoMapping[];
    structure_analysis: never[]; // Empty array, not used
    sheets: SheetAnalysis[];
}

export default function Analysis() {
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [photoMapping, setPhotoMapping] = useState<PhotoMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        analyzeTemplate();
    }, []);

    const analyzeTemplate = async () => {
        try {
            setLoading(true);
            const response = await fetch('/excel/analyze-template');
            const data = await response.json();

            if (data.success) {
                setAnalysis(data.analysis);
                setPhotoMapping(data.photo_mapping);
            } else {
                setError(data.error || 'Failed to analyze template');
            }
        } catch (err) {
            setError('Error fetching analysis: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            tower_front: 'bg-blue-100 text-blue-800',
            tower_side: 'bg-green-100 text-green-800',
            tower_back: 'bg-yellow-100 text-yellow-800',
            tower_top: 'bg-purple-100 text-purple-800',
            antenna: 'bg-red-100 text-red-800',
            equipment: 'bg-orange-100 text-orange-800',
            environment: 'bg-teal-100 text-teal-800',
            general: 'bg-gray-100 text-gray-800',
        };
        return colors[category] || colors['general'];
    };

    if (loading) {
        return (
            <AppLayout>
                <Head title="Excel Template Analysis" />
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-gray-600">Menganalisis template Excel ESR...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <Head title="Excel Template Analysis" />
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6 text-center">
                                <div className="mb-4 text-red-600">
                                    <FileSpreadsheet className="mx-auto h-12 w-12" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">Error Analyzing Template</h3>
                                <p className="text-red-600">{error}</p>
                                <Button onClick={analyzeTemplate} className="mt-4">
                                    Coba Lagi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Excel Template Analysis" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="mb-2 text-3xl font-bold text-gray-900">Analisis Template Excel ESR</h1>
                        <p className="text-gray-600">Hasil analisis struktur dan layout template Excel untuk survey tower</p>
                    </div>

                    {analysis && (
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="structure">Struktur</TabsTrigger>
                                <TabsTrigger value="photos">Foto Mapping</TabsTrigger>
                                <TabsTrigger value="implementation">Implementasi</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>📊 Template Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p>
                                                    <strong>File:</strong> {analysis.file_info?.filename || 'N/A'}
                                                </p>
                                                <p>
                                                    <strong>Total Worksheets:</strong> {analysis.sheets?.length || 0}
                                                </p>
                                                <p>
                                                    <strong>File Size:</strong> {analysis.file_info?.size ? Math.round(analysis.file_info.size / 1024) : 0} KB
                                                </p>
                                            </div>
                                            <div>
                                                <p>
                                                    <strong>Last Modified:</strong> {analysis.file_info?.last_modified || 'N/A'}
                                                </p>
                                                <p>
                                                    <strong>Status:</strong> <span className="text-green-600">✅ Ready for processing</span>
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>📋 Worksheets Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {analysis.sheets?.map((sheet: SheetAnalysis, index: number) => (
                                                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div>
                                                        <h4 className="font-medium">{sheet.name}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {sheet.dimensions.rows} rows × {sheet.dimensions.columns}{' '}
                                                            columns
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm">📷 {sheet.image_placeholders?.length || 0} photo slots</p>
                                                        <p className="text-sm text-gray-500">🖼️ {sheet.existing_images?.length || 0} existing images</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="structure" className="space-y-4">
                                {analysis.sheets?.map((sheet: SheetAnalysis, index: number) => (
                                    <Card key={index}>
                                        <CardHeader>
                                            <CardTitle>
                                                🏗️ {sheet.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p>
                                                            <strong>Dimensions:</strong> {sheet.dimensions.rows} × {sheet.dimensions.columns}
                                                        </p>
                                                        <p>
                                                            <strong>Merged Cells:</strong> {sheet.merged_cells?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p>
                                                            <strong>Photo Placeholders:</strong> {sheet.image_placeholders?.length || 0}
                                                        </p>
                                                        <p>
                                                            <strong>Existing Images:</strong> {sheet.existing_images?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p>
                                                            <strong>Content Structure:</strong> {sheet.content_structure?.length || 0}
                                                        </p>
                                                        <p>
                                                            <strong>Headers:</strong> {sheet.headers?.length || 0}
                                                        </p>
                                                    </div>
                                                </div>

                                                {sheet.content_structure && sheet.content_structure.length > 0 && (
                                                    <div>
                                                        <h5 className="mb-2 font-medium">Content Structure:</h5>
                                                        <div className="max-h-40 overflow-y-auto rounded bg-gray-50 p-3 text-xs">
                                                            {sheet.content_structure.slice(0, 10).map((cell: CellInfo, cellIndex: number) => (
                                                                <div key={cellIndex} className="mb-1">
                                                                    <strong>{cell.coordinate}:</strong> {cell.value}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {sheet.image_placeholders && sheet.image_placeholders.length > 0 && (
                                                    <div>
                                                        <h5 className="mb-2 font-medium">Photo Placeholders:</h5>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            {sheet.image_placeholders.map((placeholder: CellInfo, pIndex: number) => (
                                                                <div key={pIndex} className="rounded bg-blue-50 p-2">
                                                                    <p>
                                                                        <strong>{placeholder.coordinate}:</strong> {placeholder.value}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            <TabsContent value="photos" className="space-y-6">
                                {photoMapping.map((sheet, index) => (
                                    <Card key={index}>
                                        <CardHeader>
                                            <CardTitle>{sheet.sheet_name}</CardTitle>
                                            <CardDescription>Mapping posisi foto dan kategori yang terdeteksi</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {sheet.photo_positions.map((position, idx) => (
                                                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                                                                {position.coordinate}
                                                            </span>
                                                            {position.label && <span className="text-sm">{position.label}</span>}
                                                            {position.width && position.height && (
                                                                <span className="text-xs text-gray-500">
                                                                    {position.width}x{position.height}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={position.type === 'existing_image' ? 'bg-green-100' : 'bg-yellow-100'}
                                                            >
                                                                {position.type === 'existing_image' ? 'Existing' : 'Placeholder'}
                                                            </Badge>
                                                            {position.suggested_category && (
                                                                <Badge className={getCategoryColor(position.suggested_category)}>
                                                                    {position.suggested_category.replace('_', ' ')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            <TabsContent value="implementation" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Rencana Implementasi</CardTitle>
                                        <CardDescription>
                                            Berdasarkan analisis template, berikut adalah rencana implementasi fitur auto-organize foto
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="mb-3 font-semibold">1. Photo Categorization AI</h4>
                                                <p className="mb-2 text-sm text-gray-600">
                                                    AI akan menganalisis foto dari URL dan mengkategorikan berdasarkan:
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                    {['tower_front', 'tower_side', 'tower_back', 'antenna', 'equipment', 'environment'].map(
                                                        (category) => (
                                                            <Badge key={category} className={getCategoryColor(category)}>
                                                                {category.replace('_', ' ')}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="mb-3 font-semibold">2. Auto-Placement System</h4>
                                                <p className="text-sm text-gray-600">
                                                    Sistem akan otomatis menempatkan foto ke posisi yang tepat berdasarkan:
                                                </p>
                                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                                                    <li>Kategori foto yang terdeteksi AI</li>
                                                    <li>Label placeholder yang ada di template</li>
                                                    <li>Posisi existing images sebagai referensi</li>
                                                    <li>Ukuran dan proporsi yang sesuai</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="mb-3 font-semibold">3. Excel Generation</h4>
                                                <p className="text-sm text-gray-600">Generate file Excel baru dengan:</p>
                                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                                                    <li>Preserve semua formatting original</li>
                                                    <li>Insert foto di posisi yang tepat</li>
                                                    <li>Maintain aspect ratio dan ukuran</li>
                                                    <li>Custom filename berdasarkan site/project</li>
                                                </ul>
                                            </div>

                                            <div className="border-t pt-4">
                                                <Button className="w-full" size="lg">
                                                    Implementasi Fitur Auto-Organize
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
