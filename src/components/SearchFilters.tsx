
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Combobox } from './ui/combobox';
import { institutions } from '@/lib/institutions';

interface SearchFilterState {
    institution: string;
    course: string;
    year: string;
    semester: string;
    type: string;
}
  
interface SearchFiltersProps {
    filters: SearchFilterState;
    onFiltersChange: (newFilters: SearchFilterState) => void;
    onSearch: () => void;
}

export default function SearchFilters({ filters, onFiltersChange, onSearch }: SearchFiltersProps) {

  const institutionOptions = institutions.map(inst => ({
    value: inst.name,
    label: inst.name,
  }));

  const handleInputChange = (field: keyof SearchFilterState, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };


  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-3">
                 <Combobox
                    options={institutionOptions}
                    placeholder="Select Institution"
                    searchPlaceholder="Search institutions..."
                    value={filters.institution}
                    onSelect={(value) => handleInputChange('institution', value)}
                />
            </div>
            <div className="lg:col-span-3">
                <Input 
                    placeholder="Course name (e.g. Business Law)"
                    value={filters.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-4">
                <Select value={filters.year} onValueChange={(value) => handleInputChange('year', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2019">2019</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.semester} onValueChange={(value) => handleInputChange('semester', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="First">First</SelectItem>
                        <SelectItem value="Second">Second</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Objective">Objective</SelectItem>
                        <SelectItem value="Theory">Theory</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="lg:col-span-2">
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={onSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                </Button>
            </div>
        </div>
    </div>
  );
}
