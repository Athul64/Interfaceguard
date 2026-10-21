import os
import subprocess
import shutil
from pathlib import Path

def create_sample_repo():
    repo_dir = Path("sample-repositories/order-service").resolve()
    if repo_dir.exists():
        shutil.rmtree(repo_dir, ignore_errors=True)
    repo_dir.mkdir(parents=True, exist_ok=True)

    def git(cmd_args):
        subprocess.run(["git"] + cmd_args, cwd=str(repo_dir), check=True, capture_output=True, text=True)

    git(["init", "-b", "main"])
    git(["config", "user.name", "Demo Author"])
    git(["config", "user.email", "demo@interfaceguard.dev"])

    src_dir = repo_dir / "src" / "main" / "java" / "com" / "example" / "order"
    src_dir.mkdir(parents=True, exist_ok=True)

    # Commit 1
    (src_dir / "OrderService.java").write_text("""package com.example.order;

public interface OrderService {
    String createOrder(String customerId, double amount);
    boolean cancelOrder(String orderId);
}
""", encoding="utf-8")

    (src_dir / "StandardOrderService.java").write_text("""package com.example.order;

public class StandardOrderService implements OrderService {
    @Override
    public String createOrder(String customerId, double amount) {
        return "ord-" + customerId;
    }

    @Override
    public boolean cancelOrder(String orderId) {
        return true;
    }
}
""", encoding="utf-8")

    git(["add", "."])
    git(["commit", "-m", "Commit 1: Initial clean OrderService interface and implementation"])

    # Commit 2
    (src_dir / "OrderService.java").write_text("""package com.example.order;

public interface OrderService {
    String createOrder(String customerId, double amount);
    boolean cancelOrder(String orderId);
    boolean processPayment(String orderId, double amount);
    boolean refundPayment(String orderId, double amount);
}
""", encoding="utf-8")

    (src_dir / "StandardOrderService.java").write_text("""package com.example.order;

public class StandardOrderService implements OrderService {
    @Override
    public String createOrder(String customerId, double amount) {
        return "ord-" + customerId;
    }

    @Override
    public boolean cancelOrder(String orderId) {
        return true;
    }

    @Override
    public boolean processPayment(String orderId, double amount) {
        return amount > 0;
    }

    @Override
    public boolean refundPayment(String orderId, double amount) {
        return true;
    }
}
""", encoding="utf-8")

    git(["add", "."])
    git(["commit", "-m", "Commit 2: Add payment methods to OrderService (growth)"])

    # Commit 3
    (src_dir / "OrderService.java").write_text("""package com.example.order;

public interface OrderService {
    String createOrder(String customerId, double amount);
    boolean cancelOrder(String orderId);
    boolean processPayment(String orderId, double amount);
    boolean refundPayment(String orderId, double amount);
    void sendNotification(String customerId, String message);
    double calculateShipping(String destinationZip, double weight);
    byte[] generateInvoicePdf(String orderId);
}
""", encoding="utf-8")

    git(["add", "."])
    git(["commit", "-m", "Commit 3: Add notification, shipping, and PDF export to OrderService (bloat)"])

    # Commit 4
    (src_dir / "FastTrackOrderService.java").write_text("""package com.example.order;

public class FastTrackOrderService implements OrderService {
    @Override
    public String createOrder(String customerId, double amount) {
        return "fast-" + customerId;
    }

    @Override
    public boolean cancelOrder(String orderId) {
        return false;
    }

    @Override
    public boolean processPayment(String orderId, double amount) {
        return true;
    }

    @Override
    public boolean refundPayment(String orderId, double amount) {
        throw new UnsupportedOperationException("FastTrack orders cannot be refunded");
    }

    @Override
    public void sendNotification(String customerId, String message) {
        // No-op for fast-track orders
    }

    @Override
    public double calculateShipping(String destinationZip, double weight) {
        return 0.0;
    }

    @Override
    public byte[] generateInvoicePdf(String orderId) {
        throw new UnsupportedOperationException("PDF invoices not supported in fast-track");
    }
}
""", encoding="utf-8")

    git(["add", "."])
    git(["commit", "-m", "Commit 4: Add FastTrackOrderService with empty stubs and exceptions (ISP violations)"])

    # Commit 5
    (src_dir / "OrderService.java").write_text("""package com.example.order;

public interface OrderService {
    String createOrder(String customerId, double amount);
    boolean cancelOrder(String orderId, String reason, boolean notifyCustomer);
    boolean processPayment(String orderId, double amount);
    boolean refundPayment(String orderId, double amount);
    void sendNotification(String customerId, String message);
    double calculateShipping(String destinationZip, double weight);
    byte[] generateInvoicePdf(String orderId);
}
""", encoding="utf-8")

    (src_dir / "StandardOrderService.java").write_text("""package com.example.order;

public class StandardOrderService implements OrderService {
    @Override
    public String createOrder(String customerId, double amount) {
        return "ord-" + customerId;
    }

    @Override
    public boolean cancelOrder(String orderId, String reason, boolean notifyCustomer) {
        return true;
    }

    @Override
    public boolean processPayment(String orderId, double amount) {
        return amount > 0;
    }

    @Override
    public boolean refundPayment(String orderId, double amount) {
        return true;
    }

    @Override
    public void sendNotification(String customerId, String message) {}

    @Override
    public double calculateShipping(String destinationZip, double weight) {
        return 12.5;
    }

    @Override
    public byte[] generateInvoicePdf(String orderId) {
        return new byte[0];
    }
}
""", encoding="utf-8")

    git(["add", "."])
    git(["commit", "-m", "Commit 5: Modify cancelOrder signature (breaking change)"])

    # Commit 6 - Dependency cycle
    (src_dir / "BillingService.java").write_text("""package com.example.order;

public interface BillingService {
    boolean invoiceCustomer(String customerId, OrderService orderService);
}
""", encoding="utf-8")

    (src_dir / "OrderService.java").write_text("""package com.example.order;

public interface OrderService {
    String createOrder(String customerId, double amount);
    boolean cancelOrder(String orderId, String reason, boolean notifyCustomer);
    boolean processPayment(String orderId, double amount);
    boolean refundPayment(String orderId, double amount);
    void sendNotification(String customerId, String message);
    double calculateShipping(String destinationZip, double weight);
    byte[] generateInvoicePdf(String orderId);
    BillingService getBillingService();
}
""", encoding="utf-8")

    (src_dir / "StandardBillingService.java").write_text("""package com.example.order;

public class StandardBillingService implements BillingService {
    @Override
    public boolean invoiceCustomer(String customerId, OrderService orderService) {
        return orderService != null;
    }
}
""", encoding="utf-8")

    git(["add", "."])
    git(["commit", "-m", "Commit 6: Introduce cyclic dependency between OrderService and BillingService"])

    print("Sample repository created successfully at:", repo_dir)

if __name__ == "__main__":
    create_sample_repo()
