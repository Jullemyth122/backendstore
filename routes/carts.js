const express = require('express');
const router = express.Router();
const Cart = require('../models/Carts');
const { v4: uuidv4 } = require('uuid'); // Import the uuidv4 function


// Add an item to the user's cart
router.post('/add-to-cart', async (req, res) => {
    try {
        const { email, shoeVariation } = req.body;

        // Find the user's cart by email
        let cart = await Cart.findOne({ email });

        if (!cart) {
            const unique_id = uuidv4(); // Generate a unique ID for the cart
            // If the user doesn't have a cart yet, create one
            cart = new Cart({
                email,
                totalPrice: 0, // Initialize the total price
                orderStatus: 'cart', // Assuming this is the initial status
                shoeVariations: [],
                unique_id: unique_id, // Generate a unique ID for the cart
            });
        }

        // Add the shoeVariation to the cart
        cart.shoeVariations.push(shoeVariation);

        // Update the total price
        cart.totalPrice += shoeVariation.price;

        // Save the updated cart
        await cart.save();

        res.json({cart: cart, message:"Successfully carted!"});
    } catch (err) {
        console.error('Error adding item to cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Retrieve the user's cart items
router.get('/cart/:email', async (req, res) => {
    try {
        const { email } = req.params;
        // Find the user's cart by email
        const cart = await Cart.findOne({ email });

        if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
        }

        res.json({cart:cart, message:"Cart has been found"});
    } catch (err) {
        console.error('Error retrieving user cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove checked items from the cart
router.delete('/cart/:email/remove-checked-items', async (req, res) => {
    try {
        const { email } = req.params;
        const { itemsToRemove } = req.body;

        // Find the user's cart by email
        const cart = await Cart.findOne({ email });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Remove checked items from the cart
        cart.shoeVariations = cart.shoeVariations.filter((item) => !itemsToRemove.includes(item.id));

        // Recalculate the total price based on remaining items
        cart.totalPrice = cart.shoeVariations.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        // Save the updated cart
        await cart.save();

        res.json(cart);
    } catch (err) {
        console.error('Error removing checked items from cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/cart/:email/remove-item/:itemId', async (req, res) => {
    try {
        const { email, itemId } = req.params;

        // Find the user's cart by email
        const cart = await Cart.findOne({ email });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the index of the item with matching itemId in the shoeVariations array
        const itemIndex = cart.shoeVariations.findIndex((item) => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Remove the item from the shoeVariations array
        const removedItem = cart.shoeVariations.splice(itemIndex, 1)[0];

        // Update the total price by subtracting the removed item's price
        cart.totalPrice -= removedItem.price;

        // Save the updated cart
        await cart.save();

        res.json(cart);
    } catch (error) {
        console.error('Error deleting item from cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Update item quantity in the cart
router.put('/update-item-quantity/:email/:itemId', async (req, res) => {
    try {
        const { email, itemId } = req.params;
        const { quantity } = req.body;

        // Find the user's cart by email
        const cart = await Cart.findOne({ email });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the item in the cart
        const itemToUpdate = cart.shoeVariations.find((item) => item.id === itemId);

        if (!itemToUpdate) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Update the item quantity
        itemToUpdate.quantity = quantity;

        // Recalculate the total price based on updated quantities
        cart.totalPrice = cart.shoeVariations.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        // Save the updated cart
        await cart.save();

        res.json(cart);
    } catch (err) {
        console.error('Error updating item quantity', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove unchecked items from the cart
router.delete('/cart/:email/remove-unchecked', async (req, res) => {
    try {
        const { email } = req.params;

        // Find the user's cart by email
        const cart = await Cart.findOne({ email });

        if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
        }

        // Remove items with checkmark set to false
        cart.shoeVariations = cart.shoeVariations.filter((item) => item.checkmark);

        // Recalculate the total price based on checkmarks
        cart.totalPrice = cart.shoeVariations.reduce(
        (total, item) => (item.checkmark ? total + item.price : total),
        0
        );

        // Save the updated cart
        await cart.save();

        res.json(cart);
    } catch (err) {
        console.error('Error removing unchecked items from cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
