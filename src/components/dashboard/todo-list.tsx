"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database";

type Todo = Database["public"]["Tables"]["todos"]["Row"];

interface TodoListProps {
  initialTodos: Todo[];
}

export function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("todos")
      .insert({ title: newTodo, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setTodos([data, ...todos]);
      setNewTodo("");
    }
    setLoading(false);
    router.refresh();
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("todos")
      .update({ completed: !completed })
      .eq("id", id);

    if (!error) {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
      );
      router.refresh();
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (!error) {
      setTodos(todos.filter((todo) => todo.id !== id));
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            disabled={loading}
          />
          <Button onClick={addTodo} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {todos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No todos yet. Add one to get started!
            </p>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                />
                <span
                  className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {todo.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(todo.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
