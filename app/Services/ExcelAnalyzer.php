<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExcelAnalyzer
{
    private $spreadsheet;
    private $analysis = [];

    public function analyzeTemplate(string $filePath): array
    {
        try {
            // Load the Excel file
            $this->spreadsheet = IOFactory::load($filePath);
            
            $this->analysis = [
                'file_info' => [
                    'filename' => basename($filePath),
                    'size' => filesize($filePath),
                    'last_modified' => date('Y-m-d H:i:s', filemtime($filePath))
                ],
                'sheets' => [],
                'total_worksheets' => $this->spreadsheet->getSheetCount(),
                'photo_mapping' => [],
                'structure_analysis' => []
            ];
            
            // Analyze ALL worksheets
            foreach ($this->spreadsheet->getAllSheets() as $index => $worksheet) {
                $this->analyzeWorksheet($worksheet, $index);
            }
            
            // Generate comprehensive photo mapping
            $this->analysis['photo_mapping'] = $this->getPhotoMappingStructure();
            
            return $this->analysis;
            
        } catch (\Exception $e) {
            throw new \Exception("Error analyzing Excel file: " . $e->getMessage());
        }
    }

    private function analyzeWorksheet($worksheet, $index)
    {
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();
        
        $worksheetAnalysis = [
            'index' => $index,
            'name' => $worksheet->getTitle(),
            'dimensions' => [
                'rows' => $highestRow,
                'columns' => $highestColumn,
                'highest_column_index' => \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn)
            ],
            'merged_cells' => [],
            'headers' => [],
            'content_preview' => [],
            'images' => [],
            'photo_placeholders' => [],
            'worksheet_type' => $this->determineWorksheetType($worksheet)
        ];

        // Analyze merged cells
        foreach ($worksheet->getMergeCells() as $mergeRange) {
            $worksheetAnalysis['merged_cells'][] = $mergeRange;
        }

        // Get content preview (first 15 rows with data)
        $contentRows = 0;
        for ($row = 1; $row <= $highestRow && $contentRows < 15; $row++) {
            $rowData = [];
            $hasData = false;
            
            for ($col = 'A'; $col <= $highestColumn; $col++) {
                $cell = $worksheet->getCell($col . $row);
                $cellValue = $cell->getCalculatedValue();
                
                if (!empty($cellValue)) {
                    $rowData[$col] = $cellValue;
                    $hasData = true;
                }
            }
            
            if ($hasData) {
                $worksheetAnalysis['content_preview'][] = [
                    'row' => $row,
                    'data' => $rowData
                ];
                $contentRows++;
            }
        }

        // Look for potential photo placeholders and existing images
        $worksheetAnalysis['photo_placeholders'] = $this->findPhotoPlaceholders($worksheet);
        $worksheetAnalysis['images'] = $this->findExistingImages($worksheet);

        $this->analysis['sheets'][] = $worksheetAnalysis;
    }

    private function analyzeCellStyle($cell): array
    {
        $style = $cell->getStyle();
        
        return [
            'font' => [
                'bold' => $style->getFont()->getBold(),
                'size' => $style->getFont()->getSize(),
                'color' => $style->getFont()->getColor()->getRGB()
            ],
            'fill' => [
                'color' => $style->getFill()->getStartColor()->getRGB()
            ],
            'borders' => [
                'outline' => $style->getBorders()->getOutline()->getBorderStyle()
            ]
        ];
    }

    private function isBoldText($cell): bool
    {
        return $cell->getStyle()->getFont()->getBold();
    }

    private function isImagePlaceholder(string $value): bool
    {
        $imageKeywords = [
            'foto', 'gambar', 'image', 'picture', 'photo',
            'tower', 'antenna', 'equipment', 'site',
            'depan', 'samping', 'belakang', 'atas', 'bawah'
        ];
        
        $lowerValue = strtolower($value);
        foreach ($imageKeywords as $keyword) {
            if (strpos($lowerValue, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }

    private function analyzeImages(Worksheet $worksheet): array
    {
        $images = [];
        
        foreach ($worksheet->getDrawingCollection() as $drawing) {
            $images[] = [
                'name' => $drawing->getName(),
                'coordinates' => $drawing->getCoordinates(),
                'width' => $drawing->getWidth(),
                'height' => $drawing->getHeight(),
                'offset_x' => $drawing->getOffsetX(),
                'offset_y' => $drawing->getOffsetY()
            ];
        }
        
        return $images;
    }

    public function getPhotoMappingStructure(): array
    {
        $mapping = [];
        
        foreach ($this->analysis['sheets'] as $sheet) {
            $sheetMapping = [
                'sheet_name' => $sheet['name'],
                'photo_positions' => []
            ];
            
            // Find image placeholders and existing images
            foreach ($sheet['image_placeholders'] as $placeholder) {
                $sheetMapping['photo_positions'][] = [
                    'type' => 'placeholder',
                    'label' => $placeholder['value'],
                    'coordinate' => $placeholder['coordinate'],
                    'suggested_category' => $this->categorizePhotoType($placeholder['value'])
                ];
            }
            
            foreach ($sheet['existing_images'] as $image) {
                $sheetMapping['photo_positions'][] = [
                    'type' => 'existing_image',
                    'coordinate' => $image['coordinates'],
                    'width' => $image['width'],
                    'height' => $image['height']
                ];
            }
            
            $mapping[] = $sheetMapping;
        }
        
        return $mapping;
    }

    private function determineWorksheetType($worksheet)
    {
        $sheetName = strtolower($worksheet->getTitle());
        
        if (strpos($sheetName, 'cover') !== false) {
            return 'cover';
        } elseif (strpos($sheetName, 'site') !== false) {
            return 'site_data';
        } elseif (strpos($sheetName, 'tower') !== false) {
            return 'tower_survey';
        } elseif (strpos($sheetName, 'equipment') !== false) {
            return 'equipment';
        } elseif (strpos($sheetName, 'photo') !== false || strpos($sheetName, 'foto') !== false) {
            return 'photo_documentation';
        } else {
            return 'general';
        }
    }

    private function findPhotoPlaceholders($worksheet)
    {
        $placeholders = [];
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();

        for ($row = 1; $row <= min($highestRow, 100); $row++) {
            for ($col = 'A'; $col <= $highestColumn; $col++) {
                $cellValue = $worksheet->getCell($col . $row)->getCalculatedValue();
                
                // Look for cells that might indicate photo placement
                if (is_string($cellValue)) {
                    $lowerValue = strtolower($cellValue);
                    if (strpos($lowerValue, 'foto') !== false || 
                        strpos($lowerValue, 'photo') !== false ||
                        strpos($lowerValue, 'gambar') !== false ||
                        strpos($lowerValue, 'image') !== false) {
                        
                        $placeholders[] = [
                            'cell' => $col . $row,
                            'text' => $cellValue,
                            'type' => $this->categorizePhotoType($cellValue),
                            'row' => $row,
                            'column' => $col
                        ];
                    }
                }
            }
        }

        return $placeholders;
    }

    private function findExistingImages($worksheet)
    {
        $images = [];
        
        try {
            $drawingCollection = $worksheet->getDrawingCollection();
            
            foreach ($drawingCollection as $drawing) {
                $images[] = [
                    'name' => $drawing->getName(),
                    'description' => $drawing->getDescription(),
                    'coordinates' => $drawing->getCoordinates(),
                    'width' => $drawing->getWidth(),
                    'height' => $drawing->getHeight(),
                    'type' => get_class($drawing)
                ];
            }
        } catch (\Exception $e) {
            // No images found or error accessing images
        }

        return $images;
    }

    private function categorizePhotoType($label): string
    {
        $label = strtolower($label);
        
        if (strpos($label, 'tower') !== false || strpos($label, 'menara') !== false) {
            return 'tower_structure';
        } elseif (strpos($label, 'equipment') !== false || strpos($label, 'peralatan') !== false) {
            return 'equipment';
        } elseif (strpos($label, 'environment') !== false || strpos($label, 'lingkungan') !== false) {
            return 'environment';
        } elseif (strpos($label, 'detail') !== false) {
            return 'detail';
        } else {
            return 'general';
        }
    }
}