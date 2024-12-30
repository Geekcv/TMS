using System;

public class Node
{
    public int Data; // Data in the node
    public Node Next; // Pointer to the next node

    public Node(int data)
    {
        Data = data;
        Next = null;
    }
}

public class LinkedList
{
    private Node head; // Head of the linked list

    // Add a node at the end
    public void Append(int data)
    {
        Node newNode = new Node(data);

        if (head == null) // If the list is empty
        {
            head = newNode;
            return;
        }

        Node current = head;
        while (current.Next != null) // Traverse to the end
        {
            current = current.Next;
        }
        current.Next = newNode;
    }

    // Display the linked list
    public void Display()
    {
        Node current = head;
        while (current != null)
        {
            Console.Write(current.Data + " -> ");
            current = current.Next;
        }
        Console.WriteLine("null");
    }

    // Delete a node by value
    public void Delete(int key)
    {
        Node current = head;
        Node previous = null;

        // If the head node holds the key
        if (current != null && current.Data == key)
        {
            head = current.Next;
            return;
        }

        // Search for the key
        while (current != null && current.Data != key)
        {
            previous = current;
            current = current.Next;
        }

        if (current == null) // If the key is not present
        {
            Console.WriteLine("Key not found");
            return;
        }

        previous.Next = current.Next; // Unlink the node
    }
}

class Program
{
    static void Main(string[] args)
    {
        LinkedList ll = new LinkedList();
        ll.Append(10);
        ll.Append(20);
        ll.Append(30);
        ll.Display(); // Output: 10 -> 20 -> 30 -> null
        ll.Delete(20);
        ll.Display(); // Output: 10 -> 30 -> null
    }
}
