"use client";

import { useRouter } from "next/navigation";
import { FarmForm } from "./FarmForm";

export function FarmSetup() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      <FarmForm
        isEdit={false}
        title="Set Up Your Farm Profile"
        submitText="Create Farm Profile 🚀"
        onSuccess={() => router.push('/dashboard')}
      />
    </div>
  );
}