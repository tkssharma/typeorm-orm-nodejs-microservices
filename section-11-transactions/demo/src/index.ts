import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Account } from "./entities/Account";
import { TransactionLog } from "./entities/TransactionLog";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected!");

    const accountRepo = AppDataSource.getRepository(Account);
    const logRepo = AppDataSource.getRepository(TransactionLog);

    // Clean up
    await logRepo.delete({});
    await accountRepo.delete({});

    // Create test accounts
    const account1 = await accountRepo.save({
      ownerName: "Alice",
      balance: "1000.00",
    });
    const account2 = await accountRepo.save({
      ownerName: "Bob",
      balance: "500.00",
    });

    console.log("\n📊 Initial balances:");
    console.log(`  Alice: $${account1.balance}`);
    console.log(`  Bob: $${account2.balance}`);

    // ========================================
    // TRANSACTION EXAMPLE 1: Using transaction() method
    // ========================================
    console.log("\n💰 Transfer $200 from Alice to Bob (transaction method)...");

    await AppDataSource.transaction(async (manager) => {
      // Get accounts within transaction
      const from = await manager.findOneBy(Account, { id: account1.id });
      const to = await manager.findOneBy(Account, { id: account2.id });

      if (!from || !to) throw new Error("Account not found");

      const amount = 200;

      if (parseFloat(from.balance) < amount) {
        throw new Error("Insufficient funds");
      }

      // Update balances
      from.balance = (parseFloat(from.balance) - amount).toFixed(2);
      to.balance = (parseFloat(to.balance) + amount).toFixed(2);

      await manager.save(from);
      await manager.save(to);

      // Log the transaction
      await manager.save(TransactionLog, {
        fromAccountId: from.id,
        toAccountId: to.id,
        amount: amount.toFixed(2),
        status: "completed",
      });
    });

    // Check balances after transaction
    const updatedAccounts = await accountRepo.find();
    console.log("✅ Transfer completed!");
    console.log("📊 Balances after transfer:");
    updatedAccounts.forEach((a) => console.log(`  ${a.ownerName}: $${a.balance}`));

    // ========================================
    // TRANSACTION EXAMPLE 2: Using QueryRunner
    // ========================================
    console.log("\n💰 Transfer $100 from Bob to Alice (QueryRunner)...");

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const from = await queryRunner.manager.findOneBy(Account, { id: account2.id });
      const to = await queryRunner.manager.findOneBy(Account, { id: account1.id });

      if (!from || !to) throw new Error("Account not found");

      const amount = 100;

      if (parseFloat(from.balance) < amount) {
        throw new Error("Insufficient funds");
      }

      from.balance = (parseFloat(from.balance) - amount).toFixed(2);
      to.balance = (parseFloat(to.balance) + amount).toFixed(2);

      await queryRunner.manager.save(from);
      await queryRunner.manager.save(to);

      await queryRunner.manager.save(TransactionLog, {
        fromAccountId: from.id,
        toAccountId: to.id,
        amount: amount.toFixed(2),
        status: "completed",
      });

      await queryRunner.commitTransaction();
      console.log("✅ Transfer committed!");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log("❌ Transfer rolled back:", error);
    } finally {
      await queryRunner.release();
    }

    // ========================================
    // TRANSACTION EXAMPLE 3: Failed transaction (rollback)
    // ========================================
    console.log("\n💰 Attempting transfer of $10000 (should fail)...");

    try {
      await AppDataSource.transaction(async (manager) => {
        const from = await manager.findOneBy(Account, { id: account1.id });
        const to = await manager.findOneBy(Account, { id: account2.id });

        if (!from || !to) throw new Error("Account not found");

        const amount = 10000; // More than available

        if (parseFloat(from.balance) < amount) {
          throw new Error("Insufficient funds");
        }

        from.balance = (parseFloat(from.balance) - amount).toFixed(2);
        await manager.save(from);
        // This won't be saved because we'll throw before completing
      });
    } catch (error: any) {
      console.log("❌ Transaction failed:", error.message);
      console.log("✅ Rollback successful - balances unchanged");
    }

    // Final balances
    const finalAccounts = await accountRepo.find();
    console.log("\n📊 Final balances:");
    finalAccounts.forEach((a) => console.log(`  ${a.ownerName}: $${a.balance}`));

    // Show transaction logs
    const logs = await logRepo.find();
    console.log("\n📜 Transaction logs:");
    logs.forEach((log) => {
      console.log(`  Transfer $${log.amount} from account ${log.fromAccountId} to ${log.toAccountId} - ${log.status}`);
    });

    console.log("\n🎉 Transactions demo completed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("👋 Connection closed");
  }
}

main();
