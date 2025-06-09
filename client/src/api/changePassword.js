export async function changePassword(currentPassword, newPassword) {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:4000/api/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  return data;
}
