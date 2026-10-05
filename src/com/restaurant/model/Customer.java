package com.restaurant.model;

import java.io.Serializable;
import java.util.Objects;

/** A guest. Two customers are the same person when their phone numbers match. */
public class Customer implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String name;
    private final String phone;

    public Customer(String name, String phone) {
        this.name = name;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Customer)) return false;
        return Objects.equals(phone, ((Customer) o).phone);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(phone);
    }

    @Override
    public String toString() {
        return name + " (" + phone + ")";
    }
}
