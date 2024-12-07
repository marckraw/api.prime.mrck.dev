interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone?: string;
  website?: string;
  company?: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
  address?: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
  };
}

export async function fetchUserData(id: number): Promise<User> {
  if (!id || typeof id !== 'number') {
    throw new Error('Invalid user ID');
  }

  console.log(`Fetching user data for ID: ${id}`)
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
  console.log(response)


  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
    
  const data = await response.json();
  return data;
} 