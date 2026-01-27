import { getSupabaseServerClient } from "@/lib/supabase/forAuth"
import { redirect } from "next/navigation"
import { TodoList } from "@/components/dashboard/todo-list"

export default async function TodosPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Todos</h1>
        <p className="text-muted-foreground">Manage your tasks and stay organized.</p>
      </div>

      <TodoList initialTodos={todos || []} />
    </div>
  )
}
