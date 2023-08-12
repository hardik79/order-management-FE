const BASE_URL = 'http://localhost:3000';

export const login = async (username, password) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.token;
    } else {
      throw new Error('Login failed. Please try again.');
    }
  } catch (error) {
    throw new Error('Login failed. Please try again.');
  }
};

export const loadOrder = async (orderId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/load-order/${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('Order not found. Please try again.');
    }
  } catch (error) {
    throw new Error('Error loading order. Please try again.');
  }
};
