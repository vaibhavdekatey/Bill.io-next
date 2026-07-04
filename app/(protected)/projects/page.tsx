"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
;
import api from "@/lib/axios";

type Project = {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  Client?: {
    id: string;
    name: string;
  };
  Quotation?: {
    id: string;
    number: string;
  };
  _count: {
    Invoice: number;
    ProjectItem: number;
  };
};

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/projects");
        if (res.data.success) {
          setProjects(res.data.data);
        } else {
          setError(res.data.error || "Failed to load projects");
        }
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError(
          err.response?.data?.error ||
            "A network error occurred while loading projects.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ON_HOLD":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "CANCELLED":
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
      default:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
    }
  };

  return (
    <main className="w-full overflow-y-auto py-8 px-4 md:px-12">
      <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-4xl font-light -tracking-[4%] text-white">
              Projects
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Manage ongoing work and convert quotations into active projects
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* List Section */}
        {loading ? (
          <div className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-3xl animate-pulse" />
        ) : projects.length === 0 && !error ? (
          <div className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-3xl flex flex-col items-center justify-center gap-4">
            <span className="text-neutral-500 text-sm">No projects found.</span>
            <span className="text-neutral-600 text-xs">
              Convert a Quotation to start a new project.
            </span>
          </div>
        ) : (
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-x-auto shadow-xl w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-widest text-neutral-500">
                  <th className="font-medium p-6">Project Name</th>
                  <th className="font-medium p-6">Client</th>
                  <th className="font-medium p-6">Origin</th>
                  <th className="font-medium p-6">Status</th>
                  <th className="font-medium p-6">Created</th>
                  <th className="font-medium p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="group hover:bg-neutral-900/50 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex flex-col">
                        <Link href={`/projects/${project.id}`}
                          className="text-white font-medium hover:text-white/80 transition-colors"
                        >
                          {project.name}
                        </Link>
                        <span className="text-xs text-neutral-500 mt-1">
                          {project._count.ProjectItem} deliverables •{" "}
                          {project._count.Invoice} invoices
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-neutral-300">
                        {project.Client?.name || "-"}
                      </span>
                    </td>
                    <td className="p-6">
                      {project.Quotation ? (
                        <Link href={`/quotations/${project.Quotation.id}`}
                          className="text-neutral-400 hover:text-white text-sm hover:underline"
                        >
                          {project.Quotation.number}
                        </Link>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          project.status,
                        )}`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-neutral-400 text-sm">
                        {new Date(project.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Link href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-700 hover:bg-white hover:text-black hover:border-white transition-all text-sm font-medium text-white group-hover:border-neutral-500"
                      >
                        View
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default Projects;
