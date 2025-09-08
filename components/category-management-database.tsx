"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, FolderPlus, Tag } from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string
  subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  description?: string
}

interface CategoryManagementProps {
  categories: Category[]
  onCategoriesChange: () => void
}

export function CategoryManagementDatabase({ categories, onCategoriesChange }: CategoryManagementProps) {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [newSubcategoryName, setNewSubcategoryName] = useState("")
  const [newSubcategoryDescription, setNewSubcategoryDescription] = useState("")
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddCategory = async () => {
    if (!newCategoryName) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDescription,
        }),
      })

      if (response.ok) {
        setNewCategoryName("")
        setNewCategoryDescription("")
        setIsAddCategoryOpen(false)
        onCategoriesChange()
      } else {
        const error = await response.json()
        console.error("Error creating category:", error)
      }
    } catch (error) {
      console.error("Error creating category:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName || !selectedCategoryForSub) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubcategoryName,
          category_id: selectedCategoryForSub,
          description: newSubcategoryDescription,
        }),
      })

      if (response.ok) {
        setNewSubcategoryName("")
        setNewSubcategoryDescription("")
        setSelectedCategoryForSub("")
        setIsAddSubcategoryOpen(false)
        onCategoriesChange()
      } else {
        const error = await response.json()
        console.error("Error creating subcategory:", error)
      }
    } catch (error) {
      console.error("Error creating subcategory:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This will also delete all subcategories.")) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onCategoriesChange()
      } else {
        const error = await response.json()
        console.error("Error deleting category:", error)
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) {
      return
    }

    try {
      const response = await fetch(`/api/subcategories/${subcategoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onCategoriesChange()
      } else {
        const error = await response.json()
        console.error("Error deleting subcategory:", error)
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Category Management</h3>
          <p className="text-muted-foreground">Manage your inventory categories and subcategories</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddCategoryOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
          <Button variant="outline" onClick={() => setIsAddSubcategoryOpen(true)}>
            <Tag className="mr-2 h-4 w-4" />
            Add Subcategory
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {category.description || "No description"}
                <br />
                {category.subcategories.length} subcategories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {category.subcategories.map((subcategory) => (
                  <Badge
                    key={subcategory.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDeleteSubcategory(subcategory.id)}
                  >
                    {subcategory.name}
                    <Trash2 className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
                {category.subcategories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No subcategories</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new main category for your inventory items.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Input
                id="categoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Enter category description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName || isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog open={isAddSubcategoryOpen} onOpenChange={setIsAddSubcategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
            <DialogDescription>Add a subcategory to an existing category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentCategory">Parent Category *</Label>
              <Select value={selectedCategoryForSub} onValueChange={setSelectedCategoryForSub}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategoryName">Subcategory Name *</Label>
              <Input
                id="subcategoryName"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Enter subcategory name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategoryDescription">Description</Label>
              <Input
                id="subcategoryDescription"
                value={newSubcategoryDescription}
                onChange={(e) => setNewSubcategoryDescription(e.target.value)}
                placeholder="Enter subcategory description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSubcategoryOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSubcategory}
              disabled={!newSubcategoryName || !selectedCategoryForSub || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
